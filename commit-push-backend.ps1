# commit-push-backend.ps1
# Script to add, commit, and push backend changes

param(
    [Parameter(Mandatory=$false)]
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-Info {
    param([string]$Text)
    Write-Host $Text -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Text)
    Write-Host $Text -ForegroundColor Green
}

function Write-Error {
    param([string]$Text)
    Write-Host $Text -ForegroundColor Red
}

function Write-Warning {
    param([string]$Text)
    Write-Host $Text -ForegroundColor Yellow
}

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $scriptDir "aletheia-backend"
$rootDir = $scriptDir

Write-Info "`n=== Backend Git Operations ==="

# Check if backend has its own git repo, or if we're in a monorepo
$hasBackendGit = Test-Path (Join-Path $backendDir ".git")
$hasRootGit = Test-Path (Join-Path $rootDir ".git")

if (-not $hasBackendGit -and -not $hasRootGit) {
    Write-Error "❌ No git repository found. Please run this from the monorepo root or ensure backend is in a git repo."
    exit 1
}

# Determine working directory
if ($hasBackendGit) {
    $workingDir = $backendDir
    Write-Info "Using backend git repository"
} else {
    $workingDir = $rootDir
    Write-Info "Using monorepo root git repository (filtering backend changes)"
}

Write-Info "Directory: $workingDir`n"

# Change to working directory
Push-Location $workingDir

try {
    # Check git status
    Write-Info "Checking git status..."
    
    if ($hasBackendGit) {
        # Backend has its own repo - check all changes
        $status = git status --porcelain
    } else {
        # Monorepo - filter for backend changes only
        $status = git status --porcelain | Where-Object { $_ -match "^(\?\?|MM|AM|A | M|M )\s+aletheia-backend/" }
    }
    
    if ([string]::IsNullOrWhiteSpace($status)) {
        Write-Warning "⚠️  No changes to commit in backend."
        exit 0
    }
    
    Write-Info "`nChanges to be committed:"
    if ($hasBackendGit) {
        git status --short
    } else {
        git status --short | Where-Object { $_ -match "aletheia-backend/" }
    }
    
    # Get commit message
    if ([string]::IsNullOrWhiteSpace($Message)) {
        Write-Info "`nEnter commit message (or press Enter to use default):"
        $Message = Read-Host
        
        if ([string]::IsNullOrWhiteSpace($Message)) {
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            $Message = "chore(backend): update backend - $timestamp"
            Write-Info "Using default commit message: $Message"
        }
    } else {
        Write-Info "Using provided commit message: $Message"
    }
    
    # Add all changes
    Write-Info "`nAdding all changes..."
    if ($hasBackendGit) {
        git add .
    } else {
        # In monorepo, only add backend files
        git add aletheia-backend/
    }
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to add changes"
    }
    
    Write-Success "✓ Changes added"
    
    # Commit changes
    Write-Info "Committing changes..."
    git commit -m $Message
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to commit changes"
    }
    
    Write-Success "✓ Changes committed"
    
    # Push changes
    Write-Info "Pushing to remote..."
    $branch = git rev-parse --abbrev-ref HEAD
    git push origin $branch
    
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "⚠️  Push failed. You may need to pull first or check remote permissions."
        exit 1
    }
    
    Write-Success "✓ Changes pushed to origin/$branch"
    Write-Success "`n✅ Backend changes successfully committed and pushed!"
    
} catch {
    Write-Error "❌ Error: $_"
    exit 1
} finally {
    Pop-Location
}
