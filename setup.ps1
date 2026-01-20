# PowerShell Setup Script for IT Management Platform

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "IT Management Platform Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "Checking Python installation..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Python not found. Please install Python 3.9+" -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Installing Backend Dependencies" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

Set-Location backend
pip install -r requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Initializing database..." -ForegroundColor Yellow
python init_db.py

Set-Location ..

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Installing Frontend Dependencies" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Access Center
Write-Host ""
Write-Host "Installing Access Center dependencies..." -ForegroundColor Yellow
Set-Location "Access Center"
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Access Center dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install Access Center dependencies" -ForegroundColor Red
}
Set-Location ..

# Knowledge Base
Write-Host ""
Write-Host "Installing Knowledge Base dependencies..." -ForegroundColor Yellow
Set-Location Knowledge
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Knowledge Base dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install Knowledge Base dependencies" -ForegroundColor Red
}
Set-Location ..

# Monitoring Dashboard
Write-Host ""
Write-Host "Installing Monitoring Dashboard dependencies..." -ForegroundColor Yellow
Set-Location monitoring-dashboard
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Monitoring Dashboard dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install Monitoring Dashboard dependencies" -ForegroundColor Red
}
Set-Location ..

# Ticketing System
Write-Host ""
Write-Host "Installing Ticketing System dependencies..." -ForegroundColor Yellow
Set-Location ticketing-system
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Ticketing System dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install Ticketing System dependencies" -ForegroundColor Red
}
Set-Location ..

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start all services, run:" -ForegroundColor Yellow
Write-Host "  .\start-all.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Or start services individually:" -ForegroundColor Yellow
Write-Host "  Backend:    cd backend && uvicorn main:app --reload" -ForegroundColor White
Write-Host "  Access:     cd 'Access Center' && npm run dev" -ForegroundColor White
Write-Host "  Knowledge:  cd Knowledge && npm run dev" -ForegroundColor White
Write-Host "  Monitoring: cd monitoring-dashboard && npm run dev" -ForegroundColor White
Write-Host "  Ticketing:  cd ticketing-system && npm run dev" -ForegroundColor White
Write-Host ""
