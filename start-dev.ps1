# Start both backend and frontend development servers
# This script checks for existing processes and kills them before starting new ones

Write-Host "=== Starting Aletheia Development Servers ===" -ForegroundColor Cyan
Write-Host ""

# Function to check for orphan Node processes (excluding backend and Apollo)
function Get-OrphanNodeProcesses {
    $allNodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
    
    # Get PIDs of processes we want to preserve
    $preservedPids = @()
    
    # Preserve backend (port 3000)
    $backendConn = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue -State Listen
    if ($backendConn) {
        $preservedPids += $backendConn.OwningProcess
        Write-Host "  Preserving backend process on port 3000 (PID: $($backendConn.OwningProcess))" -ForegroundColor Gray
    }
    
    # Preserve frontend (port 3030) - we'll handle this separately
    $frontendConn = Get-NetTCPConnection -LocalPort 3030 -ErrorAction SilentlyContinue -State Listen
    if ($frontendConn) {
        $preservedPids += $frontendConn.OwningProcess
        Write-Host "  Preserving frontend process on port 3030 (PID: $($frontendConn.OwningProcess))" -ForegroundColor Gray
    }
    
    # Preserve Apollo Studio Router processes (common ports: 4000, 9693, or check command line)
    $apolloPorts = @(4000, 9693)
    foreach ($port in $apolloPorts) {
        $apolloConn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue -State Listen
        if ($apolloConn) {
            $preservedPids += $apolloConn.OwningProcess
            Write-Host "  Preserving Apollo process on port $port (PID: $($apolloConn.OwningProcess))" -ForegroundColor Gray
        }
    }
    
    # Also preserve processes with "apollo" or "backend" in command line
    $allNodeProcesses | ForEach-Object {
        try {
            $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)").CommandLine
            if ($cmdLine -match 'apollo|backend' -and $cmdLine -notmatch 'frontend') {
                $preservedPids += $_.Id
                Write-Host "  Preserving Apollo/Backend process (PID: $($_.Id))" -ForegroundColor Gray
            }
        } catch {
            # Ignore processes we can't query
        }
    }
    
    # Return processes that are NOT preserved
    $orphans = $allNodeProcesses | Where-Object { $_.Id -notin $preservedPids }
    return $orphans
}

# Check and kill existing processes on ports 3000 and 3030 (but preserve others)
Write-Host "Checking for existing servers..." -ForegroundColor Yellow

$backendConn = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
$frontendConn = Get-NetTCPConnection -LocalPort 3030 -ErrorAction SilentlyContinue

if ($backendConn) {
    $backendPid = $backendConn.OwningProcess
    Write-Host "  Stopping backend process on port 3000 (PID: $backendPid)" -ForegroundColor Gray
    Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

if ($frontendConn) {
    $frontendPid = $frontendConn.OwningProcess
    Write-Host "  Stopping frontend process on port 3030 (PID: $frontendPid)" -ForegroundColor Gray
    Stop-Process -Id $frontendPid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Check for orphan Node processes (but preserve backend and Apollo)
Write-Host "Checking for orphan Node processes..." -ForegroundColor Yellow
$orphans = Get-OrphanNodeProcesses
if ($orphans) {
    Write-Host "  Found $($orphans.Count) orphan Node process(es)" -ForegroundColor Yellow
    $orphans | ForEach-Object {
        Write-Host "    Orphan process PID: $($_.Id) - NOT killing (preserved)" -ForegroundColor Gray
    }
    Write-Host "  Note: Orphan processes preserved (backend and Apollo are protected)" -ForegroundColor Gray
} else {
    Write-Host "  No orphan processes found" -ForegroundColor Gray
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
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '=== BACKEND SERVER (Port 3000) ===' -ForegroundColor Blue; npm run start:dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Green
$frontendPath = Join-Path $PSScriptRoot "aletheia-frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '=== FRONTEND SERVER (Port 3030) ===' -ForegroundColor Green; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Both servers starting in separate windows" -ForegroundColor Green
Write-Host ""
Write-Host "Please wait 15-20 seconds for both servers to fully start." -ForegroundColor Yellow
Write-Host ""
Write-Host "Then open:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:3030" -ForegroundColor White
Write-Host "  Backend GraphQL: http://localhost:3000/graphql" -ForegroundColor White
Write-Host ""
