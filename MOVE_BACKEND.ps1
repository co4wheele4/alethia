# Script to move aletheia-backend to the monorepo
# Run this script from C:\dev directory
# Make sure to close any IDEs or processes using the backend directory first

Write-Host "Moving aletheia-backend to monorepo..." -ForegroundColor Yellow

$source = "C:\dev\aletheia-backend"
$destination = "C:\dev\aletheia\aletheia-backend"

if (Test-Path $source) {
    if (-not (Test-Path $destination)) {
        try {
            Move-Item -Path $source -Destination $destination -Force
            Write-Host "✓ Successfully moved aletheia-backend to monorepo" -ForegroundColor Green
        } catch {
            Write-Host "✗ Error moving directory: $_" -ForegroundColor Red
            Write-Host "Please close any IDEs or processes using the backend directory and try again." -ForegroundColor Yellow
        }
    } else {
        Write-Host "✗ Destination already exists: $destination" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Source directory not found: $source" -ForegroundColor Red
}
