# Push to GitHub Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Pushing to GitHub Repository" -ForegroundColor Cyan
Write-Host "Repository: kgs2026-bit/saas_email_marketing" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing git..." -ForegroundColor Yellow
    git init
}

# Add all files
Write-Host "Adding files..." -ForegroundColor Yellow
git add .

# Commit
$commitMessage = "Initial commit - Email Automation SaaS Platform"
if ($args.Count -gt 0) {
    $commitMessage = $args[0]
}

Write-Host "Committing: $commitMessage" -ForegroundColor Yellow
git commit -m $commitMessage

# Check if remote exists
$remotes = git remote
if ($remotes -notcontains "origin") {
    Write-Host "Adding remote origin..." -ForegroundColor Yellow
    git remote add origin https://github.com/kgs2026-bit/saas_email_marketing.git
} else {
    Write-Host "Remote 'origin' already exists" -ForegroundColor Green
}

# Push
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repository URL: https://github.com/kgs2026-bit/saas_email_marketing" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps for deployment:" -ForegroundColor Yellow
    Write-Host "1. Go to Railway.app and deploy backend" -ForegroundColor White
    Write-Host "2. Go to Vercel.com and deploy frontend" -ForegroundColor White
    Write-Host "3. Configure environment variables in both" -ForegroundColor White
    Write-Host ""
    Write-Host "See SETUP.md for deployment instructions." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "✗ Push failed. You might need to:" -ForegroundColor Red
    Write-Host "  1. Login to GitHub: gh auth login" -ForegroundColor Yellow
    Write-Host "  2. Or set up SSH keys" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Push manually via GitHub website" -ForegroundColor Cyan
}

Read-Host "Press Enter to exit"
