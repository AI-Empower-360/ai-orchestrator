# Deploy Lambda Webhook using CloudFormation

param(
    [string]$StackName = "lambda-github-webhook",
    [string]$Region = "us-east-1",
    [string]$CodeBuildProject = "ai-im-agent-backend-build",
    [string]$GitHubSecret = ""
)

$ErrorActionPreference = 'Stop'

Write-Host "Deploying Lambda Webhook via CloudFormation..." -ForegroundColor Cyan
Write-Host "Stack Name: $StackName" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "CodeBuild Project: $CodeBuildProject" -ForegroundColor Yellow
Write-Host ""

# Check if stack exists
$stackExists = aws cloudformation describe-stacks --stack-name $StackName --region $Region 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Stack exists, updating..." -ForegroundColor Yellow
    
    $params = @(
        "ParameterKey=CodeBuildProject,ParameterValue=$CodeBuildProject"
    )
    
    if (-not [string]::IsNullOrEmpty($GitHubSecret)) {
        $params += "ParameterKey=GitHubWebhookSecret,ParameterValue=$GitHubSecret"
    }
    
    $paramString = $params -join " "
    
    aws cloudformation update-stack `
        --stack-name $StackName `
        --template-body file://lambda-webhook-template.yaml `
        --parameters $paramString `
        --capabilities CAPABILITY_NAMED_IAM `
        --region $Region
    
    Write-Host "Stack update initiated" -ForegroundColor Green
    Write-Host "Waiting for update to complete..." -ForegroundColor Yellow
    aws cloudformation wait stack-update-complete --stack-name $StackName --region $Region
} else {
    Write-Host "Creating new stack..." -ForegroundColor Yellow
    
    $params = @(
        "ParameterKey=CodeBuildProject,ParameterValue=$CodeBuildProject"
    )
    
    if (-not [string]::IsNullOrEmpty($GitHubSecret)) {
        $params += "ParameterKey=GitHubWebhookSecret,ParameterValue=$GitHubSecret"
    }
    
    $paramString = $params -join " "
    
    aws cloudformation create-stack `
        --stack-name $StackName `
        --template-body file://lambda-webhook-template.yaml `
        --parameters $paramString `
        --capabilities CAPABILITY_NAMED_IAM `
        --region $Region
    
    Write-Host "Stack creation initiated" -ForegroundColor Green
    Write-Host "Waiting for stack to be created..." -ForegroundColor Yellow
    aws cloudformation wait stack-create-complete --stack-name $StackName --region $Region
}

# Get outputs
Write-Host ""
Write-Host "Getting stack outputs..." -ForegroundColor Yellow
$outputs = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query 'Stacks[0].Outputs' --output json | ConvertFrom-Json

$functionUrl = ($outputs | Where-Object { $_.OutputKey -eq 'FunctionURL' }).OutputValue

Write-Host ""
Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Function URL: $functionUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure GitHub webhook:" -ForegroundColor White
Write-Host "   URL: $functionUrl" -ForegroundColor Cyan
Write-Host "   Content type: application/json" -ForegroundColor White
Write-Host "   Events: Just the push event" -ForegroundColor White
Write-Host ""
Write-Host "2. GitHub Webhook URL:" -ForegroundColor White
Write-Host "   https://github.com/AI-Empower-360/ai-orchestrator/settings/hooks/new" -ForegroundColor Cyan
