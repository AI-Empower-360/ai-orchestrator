# Quick App Test Script
# Quick verification that app can start and respond
# Usage: .\test-app-quick.ps1

$ErrorActionPreference = 'Stop'

Write-Host "🚀 Quick App Test" -ForegroundColor Cyan
Write-Host ""

# Set environment variables
$env:PORT = "3001"
$env:FRONTEND_URL = "http://localhost:3000"
$env:JWT_SECRET = "test-secret-key-for-local-testing-only-32-chars"
$env:NODE_ENV = "development"

# Check if built
if (-not (Test-Path "dist\main.js")) {
    Write-Host "🔨 Building application..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed" -ForegroundColor Red
        exit 1
    }
}

# Start server
Write-Host "🚀 Starting server..." -ForegroundColor Yellow
$appProcess = Start-Process -FilePath "node" -ArgumentList "dist\main.js" -PassThru -NoNewWindow -RedirectStandardOutput "app-output.log" -RedirectStandardError "app-error.log"

Start-Sleep -Seconds 3

# Test health endpoint
Write-Host "🏥 Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Server is running and responding!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    
    $health = $response.Content | ConvertFrom-Json
    Write-Host "   Health: $($health.status)" -ForegroundColor Gray
    Write-Host "   Uptime: $($health.uptime)s" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "✅ App is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Server running on http://localhost:3001" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    
    # Keep running
    Wait-Process -Id $appProcess.Id
} catch {
    Write-Host "❌ Server not responding: $_" -ForegroundColor Red
    Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}
