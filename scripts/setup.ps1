# Email SaaS Platform - Quick Setup Script for Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Email Automation SaaS - Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is NOT installed!" -ForegroundColor Red
    Write-Host "  Please install Node.js from: https://nodejs.org" -ForegroundColor Yellow
    Write-Host "  Choose the LTS version (18.x or 20.x)" -ForegroundColor Yellow
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "Installing root dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
cd backend
npm install

Write-Host ""
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
cd ../frontend
npm install
cd ..

Write-Host ""
Write-Host "✓ Dependencies installed!" -ForegroundColor Green

# Check for .env file
Write-Host ""
Write-Host "Checking environment configuration..." -ForegroundColor Yellow

if (-not (Test-Path "backend/.env")) {
    Write-Host "⚠ backend/.env not found!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You need to set up your environment variables." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Copy backend/.env.example to backend/.env" -ForegroundColor White
    Write-Host "2. Fill in all the values" -ForegroundColor White
    Write-Host ""
    Write-Host "Required services:" -ForegroundColor Cyan
    Write-Host "  - Supabase (PostgreSQL): https://supabase.com" -ForegroundColor White
    Write-Host "  - Upstash (Redis): https://upstash.com" -ForegroundColor White
    Write-Host "  - Google Cloud Console (OAuth): https://console.cloud.google.com" -ForegroundColor White
    Write-Host "  - Stripe: https://dashboard.stripe.com" -ForegroundColor White
    Write-Host ""
    Write-Host "See SETUP.md for detailed instructions." -ForegroundColor Green
    Write-Host ""
    $response = Read-Host "Have you created .env file? (y/n)"
    if ($response -eq 'y') {
        # Generate Prisma
        Write-Host ""
        Write-Host "Generating Prisma client..." -ForegroundColor Yellow
        cd backend
        npx prisma generate
        Write-Host "✓ Prisma client generated" -ForegroundColor Green
        cd ..

        Write-Host ""
        Write-Host "✓ Setup complete! Start with: docker-compose up" -ForegroundColor Green
        Write-Host "   or: npm run dev" -ForegroundColor Green
    } else {
        Write-Host "Please create backend/.env and run this script again." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✓ backend/.env exists" -ForegroundColor Green

    # Generate Prisma client
    Write-Host ""
    Write-Host "Generating Prisma client..." -ForegroundColor Yellow
    cd backend
    npx prisma generate
    cd ..
    Write-Host "✓ Prisma client generated" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Make sure all services are configured (Supabase, Upstash, Google, Stripe)" -ForegroundColor White
Write-Host "2. Run: cd backend && npx prisma migrate dev" -ForegroundColor White
Write-Host "3. Choose your deployment method:" -ForegroundColor White
Write-Host "   - Docker: docker-compose up" -ForegroundColor Green
Write-Host "   - Manual: npm run dev" -ForegroundColor Green
Write-Host ""
Write-Host "Then open: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "For detailed help, see SETUP.md" -ForegroundColor Yellow
Write-Host ""

Read-Host "Press Enter to exit"
