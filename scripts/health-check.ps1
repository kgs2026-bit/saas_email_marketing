# Health Check Script - Verify Everything is Working

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 Email SaaS Platform - Health Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# 1. Check if Node.js is installed
Write-Host "1. Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Node.js not found. Install from: https://nodejs.org" -ForegroundColor Red
    $allGood = $false
}

# 2. Check if npm is installed
Write-Host "2. Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "   ✓ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ✗ npm not found (should come with Node.js)" -ForegroundColor Red
    $allGood = $false
}

# 3. Check if Docker is available (optional)
Write-Host "3. Checking Docker (optional)..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "   ✓ Docker: $dockerVersion" -ForegroundColor Green
    $dockerAvailable = $true
} catch {
    Write-Host "   ⚠ Docker not found (you can run without it)" -ForegroundColor Yellow
    $dockerAvailable = $false
}

# 4. Check if backend .env exists
Write-Host "4. Checking backend/.env..." -ForegroundColor Yellow
if (Test-Path "backend/.env") {
    Write-Host "   ✓ backend/.env exists" -ForegroundColor Green

    # Check for required environment variables
    $envContent = Get-Content "backend/.env"
    $requiredVars = @(
        "DATABASE_URL",
        "JWT_SECRET",
        "JWT_REFRESH_SECRET",
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
        "REDIS_URL",
        "ENCRYPTION_KEY"
    )

    Write-Host "   Checking required environment variables:" -ForegroundColor Cyan
    foreach ($var in $requiredVars) {
        if ($envContent -match "$var=") {
            Write-Host "   ✓ $var is set" -ForegroundColor Green
        } else {
            Write-Host "   ✗ $var is NOT set" -ForegroundColor Red
            $allGood = $false
        }
    }
} else {
    Write-Host "   ✗ backend/.env not found" -ForegroundColor Red
    Write-Host "     Copy backend/.env.example to backend/.env and fill in values" -ForegroundColor Yellow
    $allGood = $false
}

# 5. Check if node_modules exist
Write-Host "5. Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "backend/node_modules") {
    Write-Host "   ✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Backend node_modules not found. Run: npm install" -ForegroundColor Yellow
}

if (Test-Path "frontend/node_modules") {
    Write-Host "   ✓ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Frontend node_modules not found. Run: npm install" -ForegroundColor Yellow
}

# 6. Check if database is accessible (if Docker is running)
Write-Host "6. Checking database connection..." -ForegroundColor Yellow
if ($dockerAvailable) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 2
        if ($response.status -eq "ok") {
            Write-Host "   ✓ Backend API is running and healthy" -ForegroundColor Green
        } else {
            Write-Host "   ⚠ Backend responded but status not OK" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "   ⚠ Backend not running or not responding" -ForegroundColor Yellow
        Write-Host "     Start with: docker-compose up OR npm run dev" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ⏭ Skipped (Docker not available)" -ForegroundColor Gray
}

# 7. Check frontend
Write-Host "7. Checking frontend..." -ForegroundColor Yellow
if (Test-Path "frontend/dist") {
    Write-Host "   ✓ Frontend build exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Frontend not built yet (will build on start)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✓ All checks passed! You're ready to run." -ForegroundColor Green
    Write-Host "" -ForegroundColor Cyan
    Write-Host "To start the application:" -ForegroundColor White
    Write-Host "  Docker: docker-compose up" -ForegroundColor Cyan
    Write-Host "  Manual: npm run dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Then open: http://localhost:5173" -ForegroundColor Green
} else {
    Write-Host "✗ Some checks failed. Fix the issues above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Run this script again after fixing." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Need help? See QUICKSTART.md" -ForegroundColor Cyan
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to exit"
