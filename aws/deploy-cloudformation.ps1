# Deploy CloudFormation Stack for AI Med Backend
# Usage: .\aws\deploy-cloudformation.ps1 [environment] [region]
# Example: .\aws\deploy-cloudformation.ps1 production us-east-1

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'staging', 'production')]
    [string]$Environment = 'production',
    
    [Parameter(Mandatory=$false)]
    [string]$Region = 'us-east-1',
    
    [Parameter(Mandatory=$false)]
    [string]$ImageTag = 'latest',
    
    [Parameter(Mandatory=$false)]
    [switch]$CreateStack = $false
)

$ErrorActionPreference = 'Stop'

$StackName = "ai-med-backend-$Environment"

Write-Host "CloudFormation Deployment" -ForegroundColor Cyan
Write-Host "Stack Name: $StackName" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan
Write-Host ""

# Check if stack exists
Write-Host "Checking if stack exists..." -ForegroundColor Yellow
$stackExists = aws cloudformation describe-stacks --stack-name $StackName --region $Region 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Stack exists. Updating..." -ForegroundColor Yellow
    $action = "update"
} else {
    if ($CreateStack) {
        Write-Host "Stack does not exist. Creating..." -ForegroundColor Yellow
        $action = "create"
    } else {
        Write-Host "Stack does not exist. Use -CreateStack to create it." -ForegroundColor Red
        exit 1
    }
}

# Deploy stack
Write-Host ""
Write-Host "Deploying CloudFormation stack..." -ForegroundColor Yellow

$templateFile = "aws\cloudformation-template.yaml"

if (-not (Test-Path $templateFile)) {
    Write-Host "CloudFormation template not found: $templateFile" -ForegroundColor Red
    exit 1
}

$parameters = @(
    "ParameterKey=Environment,ParameterValue=$Environment",
    "ParameterKey=ImageTag,ParameterValue=$ImageTag",
    "ParameterKey=ContainerPort,ParameterValue=3001",
    "ParameterKey=DesiredCount,ParameterValue=2",
    "ParameterKey=Cpu,ParameterValue=512",
    "ParameterKey=Memory,ParameterValue=1024"
)

if ($action -eq "create") {
    aws cloudformation create-stack `
        --stack-name $StackName `
        --template-body file://$templateFile `
        --parameters $parameters `
        --capabilities CAPABILITY_NAMED_IAM `
        --region $Region `
        --tags Key=Environment,Value=$Environment Key=Project,Value=AI-Med-Backend
} else {
    aws cloudformation update-stack `
        --stack-name $StackName `
        --template-body file://$templateFile `
        --parameters $parameters `
        --capabilities CAPABILITY_NAMED_IAM `
        --region $Region
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "CloudFormation deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Waiting for stack $action to complete..." -ForegroundColor Yellow
aws cloudformation wait stack-$($action)-complete --stack-name $StackName --region $Region

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Stack $action completed successfully!" -ForegroundColor Green
    
    # Get stack outputs
    Write-Host ""
    Write-Host "Stack Outputs:" -ForegroundColor Cyan
    $outputs = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query 'Stacks[0].Outputs' | ConvertFrom-Json
    
    foreach ($output in $outputs) {
        Write-Host "  $($output.OutputKey): $($output.OutputValue)" -ForegroundColor White
    }
    
    $loadBalancerUrl = ($outputs | Where-Object { $_.OutputKey -eq "LoadBalancerURL" }).OutputValue
    if ($loadBalancerUrl) {
        Write-Host ""
        Write-Host "Application URL: $loadBalancerUrl" -ForegroundColor Green
        Write-Host "Health Check: $loadBalancerUrl/health" -ForegroundColor Cyan
    }
} else {
    Write-Host "Stack $action failed. Check AWS Console for details." -ForegroundColor Red
    exit 1
}
