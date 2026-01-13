# commit-push-all.ps1
# Script to add, commit, and push changes from root level (monorepo)

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

# Get the script directory (should be monorepo root)
$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Info "`n=== Monorepo Git Operations ==="
Write-Info "Root Directory: $rootDir`n"

# Check if we're in a git repository
if (-not (Test-Path (Join-Path $rootDir ".git"))) {
    Write-Error "❌ Not a git repository. Please run this from the monorepo root."
    exit 1
}

# Change to root directory
Push-Location $rootDir

try {
    # Check git status
    Write-Info "Checking git status..."
    $status = git status --porcelain
    
    if ([string]::IsNullOrWhiteSpace($status)) {
        Write-Warning "⚠️  No changes to commit."
        exit 0
    }
    
    Write-Info "`nChanges to be committed:"
    git status --short
    
    # Get commit message
    if ([string]::IsNullOrWhiteSpace($Message)) {
        Write-Info "`nEnter commit message (or press Enter to use default):"
        $Message = Read-Host
        
        if ([string]::IsNullOrWhiteSpace($Message)) {
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            $Message = "chore: update monorepo - $timestamp"
            Write-Info "Using default commit message: $Message"
        }
    } else {
        Write-Info "Using provided commit message: $Message"
    }
    
    # Add all changes
    Write-Info "`nAdding all changes..."
    git add .
    
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
    Write-Success "`n✅ All changes successfully committed and pushed!"
    
} catch {
    Write-Error "❌ Error: $_"
    exit 1
} finally {
    Pop-Location
}
