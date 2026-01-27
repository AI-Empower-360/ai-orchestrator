# Local App Testing Script
# Tests the application locally before deployment
# Usage: .\test-app-local.ps1

$ErrorActionPreference = 'Continue'

Write-Host "🧪 Testing Application Locally" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""

# Step 1: Pre-build validation
Write-Host "📋 Step 1: Pre-build Validation" -ForegroundColor Yellow
try {
    npm run validate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Pre-build validation failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Pre-build validation passed" -ForegroundColor Green
} catch {
    Write-Host "❌ Error during validation: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Build application
Write-Host "🔨 Step 2: Building Application" -ForegroundColor Yellow
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Build failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Build successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Error during build: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Check if dist directory exists
Write-Host "📁 Step 3: Verifying Build Output" -ForegroundColor Yellow
if (Test-Path "dist\main.js") {
    Write-Host "✅ Build output found: dist\main.js" -ForegroundColor Green
} else {
    Write-Host "❌ Build output not found" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Start application in background
Write-Host "🚀 Step 4: Starting Application" -ForegroundColor Yellow
$env:PORT = "3001"
$env:FRONTEND_URL = "http://localhost:3000"
$env:JWT_SECRET = "test-secret-key-for-local-testing-only-32-chars"
$env:NODE_ENV = "development"

$appProcess = $null
try {
    Write-Host "Starting server on port 3001..." -ForegroundColor Gray
    $appProcess = Start-Process -FilePath "node" -ArgumentList "dist\main.js" -PassThru -NoNewWindow -RedirectStandardOutput "app-output.log" -RedirectStandardError "app-error.log"
    
    # Wait for server to start
    Write-Host "Waiting for server to start..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
    
    Write-Host "✅ Application started (PID: $($appProcess.Id))" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start application: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 5: Test health endpoint
Write-Host "🏥 Step 5: Testing Health Endpoint" -ForegroundColor Yellow
$maxRetries = 10
$retryCount = 0
$healthCheckPassed = $false

while ($retryCount -lt $maxRetries -and -not $healthCheckPassed) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Health endpoint responding (Status: $($response.StatusCode))" -ForegroundColor Green
            $healthData = $response.Content | ConvertFrom-Json
            Write-Host "   Status: $($healthData.status)" -ForegroundColor Gray
            Write-Host "   Uptime: $($healthData.uptime)s" -ForegroundColor Gray
            $healthCheckPassed = $true
        }
    } catch {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "   Waiting for server... (Attempt $retryCount/$maxRetries)" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        } else {
            Write-Host "❌ Health endpoint not responding after $maxRetries attempts" -ForegroundColor Red
            Write-Host "   Check app-error.log for details" -ForegroundColor Yellow
        }
    }
}

if (-not $healthCheckPassed) {
    if ($appProcess) {
        Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
    }
    exit 1
}

Write-Host ""

# Step 6: Test readiness endpoint
Write-Host "✅ Step 6: Testing Readiness Endpoint" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health/readiness" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Readiness endpoint responding" -ForegroundColor Green
        $readinessData = $response.Content | ConvertFrom-Json
        Write-Host "   Ready: $($readinessData.ready)" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Readiness endpoint test failed: $_" -ForegroundColor Yellow
}

Write-Host ""

# Step 7: Test liveness endpoint
Write-Host "💓 Step 7: Testing Liveness Endpoint" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health/liveness" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Liveness endpoint responding" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Liveness endpoint test failed: $_" -ForegroundColor Yellow
}

Write-Host ""

# Step 8: Test authentication endpoint (if available)
Write-Host "🔐 Step 8: Testing Authentication Endpoint" -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "doctor@example.com"
        password = "password123"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "http://localhost:3001/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Authentication endpoint responding" -ForegroundColor Green
        $authData = $response.Content | ConvertFrom-Json
        if ($authData.token) {
            Write-Host "   Token received: $($authData.token.Substring(0, 20))..." -ForegroundColor Gray
            $script:authToken = $authData.token
        }
    }
} catch {
    Write-Host "⚠️  Authentication endpoint test failed: $_" -ForegroundColor Yellow
    Write-Host "   This is expected if endpoint requires different credentials" -ForegroundColor Gray
}

Write-Host ""

# Step 9: Test alerts endpoint (if authenticated)
Write-Host "📢 Step 9: Testing Alerts Endpoint" -ForegroundColor Yellow
if ($script:authToken) {
    try {
        $headers = @{
            "Authorization" = "Bearer $($script:authToken)"
        }
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/alerts" -Method GET -Headers $headers -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Alerts endpoint responding" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Alerts endpoint test failed: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  Skipping (authentication required)" -ForegroundColor Gray
}

Write-Host ""

# Step 10: Check application logs
Write-Host "📝 Step 10: Checking Application Logs" -ForegroundColor Yellow
if (Test-Path "app-error.log") {
    $errorLog = Get-Content "app-error.log" -Raw
    if ($errorLog -and $errorLog.Trim().Length -gt 0) {
        Write-Host "⚠️  Errors found in app-error.log:" -ForegroundColor Yellow
        Write-Host $errorLog -ForegroundColor Red
    } else {
        Write-Host "✅ No errors in logs" -ForegroundColor Green
    }
} else {
    Write-Host "✅ No error log file (no errors)" -ForegroundColor Green
}

Write-Host ""

# Summary
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan

if ($healthCheckPassed) {
    Write-Host "✅ Application is running and responding" -ForegroundColor Green
    Write-Host ""
    Write-Host "Application is ready for deployment!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Review the test results above" -ForegroundColor White
    Write-Host "2. If all tests passed, proceed with deployment:" -ForegroundColor White
    Write-Host "   .\deploy.ps1 production" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To stop the test server, press Ctrl+C or run:" -ForegroundColor Yellow
    Write-Host "   Stop-Process -Id $($appProcess.Id) -Force" -ForegroundColor Gray
} else {
    Write-Host "❌ Application tests failed" -ForegroundColor Red
    Write-Host "Please fix the issues before deploying" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Server is still running. Press Ctrl+C to stop." -ForegroundColor Yellow

# Keep server running until user stops it
try {
    Wait-Process -Id $appProcess.Id
} catch {
    Write-Host "`nServer stopped." -ForegroundColor Gray
}
