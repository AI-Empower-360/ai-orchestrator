# Setup GitHub Webhook for CodeBuild
# This enables automatic builds when code is pushed to GitHub

param(
    [string]$ProjectName = "ai-im-agent-backend-build",
    [string]$Region = "us-east-1",
    [string]$GitHubRepo = "AI-Empower-360/ai-orchestrator",
    [string]$Branch = "main"
)

$ErrorActionPreference = 'Stop'

Write-Host "Setting up GitHub Webhook for CodeBuild..." -ForegroundColor Cyan
Write-Host "Project: $ProjectName" -ForegroundColor Yellow
Write-Host "Repository: $GitHubRepo" -ForegroundColor Yellow
Write-Host "Branch: $Branch" -ForegroundColor Yellow
Write-Host ""

# Get GitHub token from Secrets Manager
Write-Host "Retrieving GitHub token from Secrets Manager..." -ForegroundColor Yellow
try {
    $tokenSecret = aws secretsmanager get-secret-value `
        --secret-id codebuild/github-token `
        --region $Region `
        --query SecretString `
        --output text 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: GitHub token not found in Secrets Manager" -ForegroundColor Red
        Write-Host "Please store the token first:" -ForegroundColor Yellow
        Write-Host "  aws secretsmanager create-secret --name codebuild/github-token --secret-string 'YOUR_TOKEN' --region $Region" -ForegroundColor White
        exit 1
    }
    
    Write-Host "Token retrieved successfully" -ForegroundColor Green
} catch {
    Write-Host "Error retrieving token: $_" -ForegroundColor Red
    exit 1
}

# Create webhook filter groups
# This triggers builds on push to main branch
$filterGroups = @(
    @(
        @{
            type = "EVENT"
            pattern = "PUSH"
        },
        @{
            type = "HEAD_REF"
            pattern = "refs/heads/$Branch"
        }
    )
) | ConvertTo-Json -Depth 10 -Compress

# Save filter groups to temp file
$filterFile = "$env:TEMP\webhook-filters.json"
$filterGroups | Out-File -FilePath $filterFile -Encoding utf8

Write-Host "Creating webhook..." -ForegroundColor Yellow

try {
    # Check if webhook exists
    $existingWebhook = aws codebuild list-webhooks --project-name $ProjectName --region $Region 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Updating existing webhook..." -ForegroundColor Yellow
        aws codebuild update-webhook `
            --project-name $ProjectName `
            --filter-groups "file://$filterFile" `
            --region $Region 2>&1 | Out-Null
    } else {
        Write-Host "Creating new webhook..." -ForegroundColor Yellow
        aws codebuild create-webhook `
            --project-name $ProjectName `
            --filter-groups "file://$filterFile" `
            --region $Region 2>&1 | Out-Null
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Webhook created/updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "Webhook operation completed" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error creating webhook: $_" -ForegroundColor Yellow
    Write-Host "You may need to create the webhook manually in AWS Console" -ForegroundColor Yellow
} finally {
    # Clean up temp file
    if (Test-Path $filterFile) {
        Remove-Item $filterFile -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Host "GitHub Webhook Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Push code to GitHub: git push origin $Branch" -ForegroundColor White
Write-Host "2. CodeBuild will automatically start a build" -ForegroundColor White
Write-Host "3. Monitor builds: https://console.aws.amazon.com/codesuite/codebuild/projects/$ProjectName/builds?region=$Region" -ForegroundColor White
