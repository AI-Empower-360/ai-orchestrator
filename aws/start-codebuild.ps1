# Start a CodeBuild build for AI IM Agent Backend

param(
    [string]$ProjectName = "ai-im-agent-backend-build",
    [string]$Region = "us-east-1",
    [string]$Branch = "main"
)

$ErrorActionPreference = 'Stop'

Write-Host "Starting CodeBuild project: $ProjectName" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "Branch: $Branch" -ForegroundColor Yellow
Write-Host ""

try {
    $buildResult = aws codebuild start-build `
        --project-name $ProjectName `
        --source-version "refs/heads/$Branch" `
        --region $Region | ConvertFrom-Json
    
    $buildId = $buildResult.build.id
    $buildArn = $buildResult.build.arn
    
    Write-Host "Build started successfully!" -ForegroundColor Green
    Write-Host "Build ID: $buildId" -ForegroundColor White
    Write-Host "Build ARN: $buildArn" -ForegroundColor White
    Write-Host ""
    Write-Host "Monitor build progress:" -ForegroundColor Cyan
    Write-Host "  Console: https://console.aws.amazon.com/codesuite/codebuild/projects/$ProjectName/build/$buildId/?region=$Region" -ForegroundColor White
    Write-Host ""
    Write-Host "Or watch logs:" -ForegroundColor Cyan
    Write-Host "  aws codebuild batch-get-builds --ids $buildId --region $Region" -ForegroundColor White
    
    # Optionally wait for build to complete
    $wait = Read-Host "Wait for build to complete? (y/n)"
    if ($wait -eq "y" -or $wait -eq "Y") {
        Write-Host "Waiting for build to complete..." -ForegroundColor Yellow
        aws codebuild batch-get-builds --ids $buildId --region $Region --query 'builds[0].buildStatus' --output text | ForEach-Object {
            while ($_ -eq "IN_PROGRESS") {
                Start-Sleep -Seconds 10
                $_ = aws codebuild batch-get-builds --ids $buildId --region $Region --query 'builds[0].buildStatus' --output text
                Write-Host "Build status: $_" -ForegroundColor Yellow
            }
        }
        
        $finalStatus = aws codebuild batch-get-builds --ids $buildId --region $Region --query 'builds[0].buildStatus' --output text
        if ($finalStatus -eq "SUCCEEDED") {
            Write-Host "Build succeeded!" -ForegroundColor Green
        } else {
            Write-Host "Build failed with status: $finalStatus" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "Error starting build: $_" -ForegroundColor Red
    exit 1
}
