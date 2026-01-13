# commit-push-frontend.ps1
# Script to add, commit, and push frontend changes

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
$frontendDir = Join-Path $scriptDir "aletheia-frontend"
$rootDir = $scriptDir

Write-Info "`n=== Frontend Git Operations ==="

# Check if frontend has its own git repo, or if we're in a monorepo
$hasFrontendGit = Test-Path (Join-Path $frontendDir ".git")
$hasRootGit = Test-Path (Join-Path $rootDir ".git")

if (-not $hasFrontendGit -and -not $hasRootGit) {
    Write-Error "❌ No git repository found. Please run this from the monorepo root or ensure frontend is in a git repo."
    exit 1
}

# Determine working directory
if ($hasFrontendGit) {
    $workingDir = $frontendDir
    Write-Info "Using frontend git repository"
} else {
    $workingDir = $rootDir
    Write-Info "Using monorepo root git repository (filtering frontend changes)"
}

Write-Info "Directory: $workingDir`n"

# Change to working directory
Push-Location $workingDir

try {
    # Check git status
    Write-Info "Checking git status..."
    
    if ($hasFrontendGit) {
        # Frontend has its own repo - check all changes
        $status = git status --porcelain
    } else {
        # Monorepo - filter for frontend changes only
        $status = git status --porcelain | Where-Object { $_ -match "^(\?\?|MM|AM|A | M|M )\s+aletheia-frontend/" }
    }
    
    if ([string]::IsNullOrWhiteSpace($status)) {
        Write-Warning "⚠️  No changes to commit in frontend."
        exit 0
    }
    
    Write-Info "`nChanges to be committed:"
    if ($hasFrontendGit) {
        git status --short
    } else {
        git status --short | Where-Object { $_ -match "aletheia-frontend/" }
    }
    
    # Get commit message
    if ([string]::IsNullOrWhiteSpace($Message)) {
        Write-Info "`nEnter commit message (or press Enter to use default):"
        $Message = Read-Host
        
        if ([string]::IsNullOrWhiteSpace($Message)) {
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            $Message = "chore(frontend): update frontend - $timestamp"
            Write-Info "Using default commit message: $Message"
        }
    } else {
        Write-Info "Using provided commit message: $Message"
    }
    
    # Add all changes
    Write-Info "`nAdding all changes..."
    if ($hasFrontendGit) {
        git add .
    } else {
        # In monorepo, only add frontend files
        git add aletheia-frontend/
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
    Write-Success "`n✅ Frontend changes successfully committed and pushed!"
    
} catch {
    Write-Error "❌ Error: $_"
    exit 1
} finally {
    Pop-Location
}
