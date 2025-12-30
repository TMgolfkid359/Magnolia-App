# GitHub Setup Script for Magnolia Flight Portal
# Run this script after installing Git

Write-Host "Setting up GitHub repository..." -ForegroundColor Green

# Check if git is installed
try {
    $gitVersion = git --version
    Write-Host "Git found: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Git is not installed!" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "Then restart PowerShell and run this script again." -ForegroundColor Yellow
    exit 1
}

# Initialize git repository
Write-Host "`nInitializing git repository..." -ForegroundColor Cyan
git init

# Add all files
Write-Host "Adding files..." -ForegroundColor Cyan
git add .

# Create initial commit
Write-Host "Creating initial commit..." -ForegroundColor Cyan
git commit -m "Initial commit: Magnolia Flight Portal with FSP integration"

Write-Host "`n✓ Local repository initialized!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Go to https://github.com and create a new repository" -ForegroundColor White
Write-Host "2. Name it: magnolia-flight-portal (or your preferred name)" -ForegroundColor White
Write-Host "3. DO NOT initialize with README" -ForegroundColor White
Write-Host "4. Copy the repository URL (e.g., https://github.com/YOUR_USERNAME/magnolia-flight-portal.git)" -ForegroundColor White
Write-Host "5. Run these commands (replace with your URL):" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/magnolia-flight-portal.git" -ForegroundColor Cyan
Write-Host "   git branch -M main" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host "`nOr use GitHub Desktop for a visual interface!" -ForegroundColor Green


