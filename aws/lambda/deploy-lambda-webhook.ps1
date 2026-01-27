# Deploy Lambda Function for GitHub Webhook Handler

param(
    [string]$FunctionName = "github-webhook-handler",
    [string]$Region = "us-east-1",
    [string]$CodeBuildProject = "ai-im-agent-backend-build",
    [string]$GitHubSecret = ""
)

$ErrorActionPreference = 'Stop'

Write-Host "Deploying Lambda Webhook Handler..." -ForegroundColor Cyan
Write-Host "Function Name: $FunctionName" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "CodeBuild Project: $CodeBuildProject" -ForegroundColor Yellow
Write-Host ""

# Get GitHub webhook secret from Secrets Manager if not provided
if ([string]::IsNullOrEmpty($GitHubSecret)) {
    Write-Host "Retrieving GitHub webhook secret from Secrets Manager..." -ForegroundColor Yellow
    try {
        $secret = aws secretsmanager get-secret-value `
            --secret-id codebuild/github-token `
            --region $Region `
            --query SecretString `
            --output text 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            $GitHubSecret = $secret
            Write-Host "Secret retrieved" -ForegroundColor Green
        } else {
            Write-Host "Warning: Could not retrieve secret. You can set it manually later." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Warning: Could not retrieve secret. Set GITHUB_WEBHOOK_SECRET manually." -ForegroundColor Yellow
    }
}

# Create deployment package
Write-Host "Creating deployment package..." -ForegroundColor Yellow
$lambdaDir = Join-Path $PSScriptRoot "lambda-package"
if (Test-Path $lambdaDir) {
    Remove-Item $lambdaDir -Recurse -Force
}
New-Item -ItemType Directory -Path $lambdaDir -Force | Out-Null

# Copy Lambda function
Copy-Item (Join-Path $PSScriptRoot "webhook-handler.py") (Join-Path $lambdaDir "lambda_function.py")

# Note: boto3 is included in Lambda Python runtime, no need to install
Write-Host "Skipping dependencies (boto3 included in Lambda runtime)" -ForegroundColor Yellow

# Create ZIP file
$zipFile = Join-Path $PSScriptRoot "lambda-webhook-handler.zip"
if (Test-Path $zipFile) {
    Remove-Item $zipFile -Force
}

Write-Host "Creating ZIP package..." -ForegroundColor Yellow
Compress-Archive -Path "$lambdaDir\*" -DestinationPath $zipFile -Force

# Create IAM role for Lambda
$roleName = "lambda-github-webhook-role"
Write-Host "Creating IAM role for Lambda..." -ForegroundColor Yellow

$trustPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Principal = @{
                Service = "lambda.amazonaws.com"
            }
            Action = "sts:AssumeRole"
        }
    )
} | ConvertTo-Json -Compress

try {
    aws iam create-role `
        --role-name $roleName `
        --assume-role-policy-document $trustPolicy `
        --region $Region 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Role created" -ForegroundColor Green
    } else {
        Write-Host "Role may already exist" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Error creating role: $_" -ForegroundColor Yellow
}

# Attach policies
Write-Host "Attaching policies..." -ForegroundColor Yellow

# Basic Lambda execution
aws iam attach-role-policy `
    --role-name $roleName `
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole `
    --region $Region 2>&1 | Out-Null

# CodeBuild permissions
$codebuildPolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Action = @(
                "codebuild:StartBuild",
                "codebuild:BatchGetBuilds"
            )
            Resource = "arn:aws:codebuild:${Region}:*:project/${CodeBuildProject}"
        }
    )
} | ConvertTo-Json -Compress

$policyFile = "$env:TEMP\lambda-codebuild-policy.json"
$codebuildPolicy | Out-File -FilePath $policyFile -Encoding utf8

aws iam put-role-policy `
    --role-name $roleName `
    --policy-name CodeBuildStartBuildPolicy `
    --policy-document "file://$policyFile" `
    --region $Region 2>&1 | Out-Null

Remove-Item $policyFile -ErrorAction SilentlyContinue

Write-Host "Policies attached" -ForegroundColor Green

# Get role ARN
Start-Sleep -Seconds 2
$roleArn = aws iam get-role --role-name $roleName --region $Region --query 'Role.Arn' --output text 2>&1

# Create or update Lambda function
Write-Host "Creating/updating Lambda function..." -ForegroundColor Yellow

$functionExists = aws lambda get-function --function-name $FunctionName --region $Region 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Updating existing function..." -ForegroundColor Yellow
    aws lambda update-function-code `
        --function-name $FunctionName `
        --zip-file "fileb://$zipFile" `
        --region $Region | Out-Null
    
    # Update environment variables
    $envVars = @{
        CODEBUILD_PROJECT = $CodeBuildProject
        AWS_REGION = $Region
    }
    
    if (-not [string]::IsNullOrEmpty($GitHubSecret)) {
        $envVars.GITHUB_WEBHOOK_SECRET = $GitHubSecret
    }
    
    $envJson = ($envVars.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ','
    
    aws lambda update-function-configuration `
        --function-name $FunctionName `
        --environment "Variables={$envJson}" `
        --region $Region | Out-Null
    
    Write-Host "Function updated" -ForegroundColor Green
} else {
    Write-Host "Creating new function..." -ForegroundColor Yellow
    
    $envVars = @{
        CODEBUILD_PROJECT = $CodeBuildProject
        AWS_REGION = $Region
    }
    
    if (-not [string]::IsNullOrEmpty($GitHubSecret)) {
        $envVars.GITHUB_WEBHOOK_SECRET = $GitHubSecret
    }
    
    $envJson = ($envVars.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join ','
    
    aws lambda create-function `
        --function-name $FunctionName `
        --runtime python3.11 `
        --role $roleArn `
        --handler lambda_function.lambda_handler `
        --zip-file "fileb://$zipFile" `
        --timeout 30 `
        --memory-size 256 `
        --environment "Variables={$envJson}" `
        --region $Region | Out-Null
    
    Write-Host "Function created" -ForegroundColor Green
}

# Create Function URL
Write-Host "Creating Function URL..." -ForegroundColor Yellow

try {
    $urlResponse = aws lambda create-function-url-config `
        --function-name $FunctionName `
        --auth-type NONE `
        --cors '{"AllowOrigins":["*"],"AllowMethods":["POST"],"AllowHeaders":["*"]}' `
        --region $Region 2>&1 | ConvertFrom-Json
    
    $functionUrl = $urlResponse.FunctionUrl
    
    Write-Host "Function URL created: $functionUrl" -ForegroundColor Green
} catch {
    # Try to get existing URL
    try {
        $urlResponse = aws lambda get-function-url-config `
            --function-name $FunctionName `
            --region $Region 2>&1 | ConvertFrom-Json
        
        $functionUrl = $urlResponse.FunctionUrl
        Write-Host "Function URL: $functionUrl" -ForegroundColor Green
    } catch {
        Write-Host "Warning: Could not create/get Function URL" -ForegroundColor Yellow
        $functionUrl = ""
    }
}

# Clean up
Remove-Item $lambdaDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Lambda Function Deployed Successfully!" -ForegroundColor Green
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
Write-Host ""
Write-Host "3. Test webhook:" -ForegroundColor White
Write-Host "   Push code to main branch and verify build starts" -ForegroundColor White
