# Initialize Git and Push to GitHub

param(
    [string]$CommitMessage = "Initial commit - Email Automation SaaS Platform"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GitHub Push Helper" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if already a git repo
if (Test-Path ".git") {
    Write-Host "Git repository already initialized." -ForegroundColor Yellow
} else {
    Write-Host "Initializing git..." -ForegroundColor Yellow
    git init
}

# Add all files
Write-Host "Staging all files..." -ForegroundColor Yellow
git add .

# Show status
Write-Host ""
Write-Host "Files to be committed:" -ForegroundColor Cyan
git status --short

# Commit
Write-Host ""
Write-Host "Committing..." -ForegroundColor Yellow
git commit -m $CommitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit failed. Resolve conflicts first." -ForegroundColor Red
    exit 1
}

# Check current branch
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "Renaming branch to main..." -ForegroundColor Yellow
    git branch -M main
}

# Check if remote exists
$remoteCheck = git remote get-url origin 2>$null
if (-not $remoteCheck) {
    Write-Host ""
    Write-Host "Adding GitHub remote..." -ForegroundColor Yellow
    git remote add origin https://github.com/kgs2026-bit/saas_email_marketing.git
} else {
    Write-Host "Remote 'origin' already exists: $remoteCheck" -ForegroundColor Green
}

# Push
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ready to push to GitHub!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repository: https://github.com/kgs2026-bit/saas_email_marketing" -ForegroundColor White
Write-Host "Branch: main" -ForegroundColor White
Write-Host ""
Write-Host "Executing: git push -u origin main" -ForegroundColor Yellow
Write-Host ""

# Ask for confirmation before pushing (optional)
$response = Read-Host "Push to GitHub? (y/n)"
if ($response -eq 'y') {
    git push -u origin main

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your repository: https://github.com/kgs2026-bit/saas_email_marketing" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Read DEPLOYMENT.md for step-by-step deployment" -ForegroundColor White
        Write-Host "2. Set up Railway for backend" -ForegroundColor White
        Write-Host "3. Set up Vercel for frontend" -ForegroundColor White
        Write-Host ""
        Write-Host "🎉 Your SaaS platform is now on GitHub!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "✗ Push failed. Possible reasons:" -ForegroundColor Red
        Write-Host "  - You don't have permission to push (check repo ownership)" -ForegroundColor Yellow
        Write-Host "  - Authentication required (use gh auth login)" -Forecolor Yellow
        Write-Host "  - Repository doesn't exist yet" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Alternative: Push manually via GitHub website" -ForegroundColor Cyan
        Write-Host "  1. Go to https://github.com/kgs2026-bit/saas_email_marketing" -ForegroundColor White
        Write-Host "  2. Upload files manually" -ForegroundColor White
    }
} else {
    Write-Host "Push cancelled. You can push manually later:" -ForegroundColor Yellow
    Write-Host "  git push -u origin main" -ForegroundColor White
}

Write-Host ""
Read-Host "Press Enter to exit"
