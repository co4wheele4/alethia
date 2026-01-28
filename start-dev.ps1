# Start both backend and frontend development servers
# This script finds the first free port (starting at the defaults) if a port is already in use.

Write-Host "=== Starting Aletheia Development Servers ===" -ForegroundColor Cyan
Write-Host ""

function Test-PortInUse {
    param(
        [Parameter(Mandatory = $true)][int]$Port
    )
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        return [bool]$conn
    } catch {
        # Fallback if Get-NetTCPConnection isn't available.
        try {
            return (Test-NetConnection -ComputerName "127.0.0.1" -Port $Port -InformationLevel Quiet)
        } catch {
            return $false
        }
    }
}

function Get-FirstFreePort {
    param(
        [Parameter(Mandatory = $true)][int]$StartPort,
        [int]$MaxTries = 50
    )
    $port = $StartPort
    for ($i = 0; $i -lt $MaxTries; $i++) {
        if (-not (Test-PortInUse -Port $port)) {
            return $port
        }
        $port++
    }
    throw "No free port found in range [$StartPort, $($StartPort + $MaxTries - 1)]."
}

$backendDefaultPort = 3000
$frontendDefaultPort = 3030

$backendPort = Get-FirstFreePort -StartPort $backendDefaultPort
$frontendPort = Get-FirstFreePort -StartPort $frontendDefaultPort

if ($backendPort -ne $backendDefaultPort) {
    Write-Host "Backend default port $backendDefaultPort is in use; using $backendPort instead." -ForegroundColor Yellow
}
if ($frontendPort -ne $frontendDefaultPort) {
    Write-Host "Frontend default port $frontendDefaultPort is in use; using $frontendPort instead." -ForegroundColor Yellow
}

Write-Host ""

# Check database
Write-Host "Checking database..." -ForegroundColor Yellow
$dbPort = 7432
$dbConn = Get-NetTCPConnection -LocalPort $dbPort -ErrorAction SilentlyContinue -State Listen
if (-not $dbConn) {
    Write-Host "  ⚠️  WARNING: Database is NOT running on port $dbPort" -ForegroundColor Red
    Write-Host "     Backend will fail to start. Please start PostgreSQL first." -ForegroundColor Yellow
    Write-Host ""
}

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Green
$backendPath = Join-Path $PSScriptRoot "aletheia-backend"
$allowedOrigins = @(
    "http://localhost:$backendPort",
    "http://127.0.0.1:$backendPort",
    "http://localhost:$frontendPort",
    "http://127.0.0.1:$frontendPort"
) -join ","
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; `$env:PORT='$backendPort'; `$env:ALLOWED_ORIGINS='$allowedOrigins'; Write-Host '=== BACKEND SERVER (Port $backendPort) ===' -ForegroundColor Blue; npm run start:dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Green
$frontendPath = Join-Path $PSScriptRoot "aletheia-frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; `$env:PORT='$frontendPort'; `$env:NEXT_PUBLIC_GRAPHQL_URL='http://localhost:$backendPort/graphql'; Write-Host '=== FRONTEND SERVER (Port $frontendPort) ===' -ForegroundColor Green; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Both servers starting in separate windows" -ForegroundColor Green
Write-Host ""
Write-Host "Please wait 15-20 seconds for both servers to fully start." -ForegroundColor Yellow
Write-Host ""
Write-Host "Then open:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:$frontendPort" -ForegroundColor White
Write-Host "  Backend GraphQL: http://localhost:$backendPort/graphql" -ForegroundColor White
Write-Host ""
