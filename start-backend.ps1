# Start Backend Server Script
Write-Host "Starting MSP Backend Server..." -ForegroundColor Green

# Navigate to backend directory
Set-Location -Path "$PSScriptRoot\backend"

# Check if virtual environment exists
if (!(Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Initialize database with sample data
Write-Host "`nInitializing database..." -ForegroundColor Cyan
python init_db.py

# Start the server
Write-Host "`nStarting FastAPI server on http://localhost:8000..." -ForegroundColor Green
Write-Host "API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

python -m uvicorn main:app --reload --port 8000
