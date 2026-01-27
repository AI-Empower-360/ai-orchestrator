# AWS Deployment Script for AI Med Backend
# Usage: .\deploy-aws.ps1 [environment] [region]
# Example: .\deploy-aws.ps1 production us-east-1

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('dev', 'development', 'staging', 'production')]
    [string]$Environment = 'production',
    
    [Parameter(Mandatory=$false)]
    [string]$Region = 'us-east-1',
    
    [Parameter(Mandatory=$false)]
    [string]$ECRRepository = 'ai-med-backend',
    
    [Parameter(Mandatory=$false)]
    [string]$ECSCluster = 'ai-med-cluster',
    
    [Parameter(Mandatory=$false)]
    [string]$ECSService = 'ai-med-backend-service'
)

$ErrorActionPreference = 'Stop'

Write-Host "AWS Deployment for $Environment environment" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan
Write-Host ""

# Check AWS CLI
Write-Host "Checking AWS CLI..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version
    Write-Host "AWS CLI found: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "AWS CLI not found. Please install AWS CLI first." -ForegroundColor Red
    Write-Host "Download from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Check AWS credentials
Write-Host "Checking AWS credentials..." -ForegroundColor Yellow
try {
    $awsIdentity = aws sts get-caller-identity --region $Region 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "AWS credentials not configured"
    }
    Write-Host "AWS credentials configured" -ForegroundColor Green
    $identity = $awsIdentity | ConvertFrom-Json
    Write-Host "Account: $($identity.Account)" -ForegroundColor Gray
    Write-Host "User/Role: $($identity.Arn)" -ForegroundColor Gray
} catch {
    Write-Host "AWS credentials not configured. Please run 'aws configure'" -ForegroundColor Red
    exit 1
}

# Pre-deployment checks
Write-Host ""
Write-Host "Running pre-deployment checks..." -ForegroundColor Yellow
try {
    npm run validate
    if ($LASTEXITCODE -ne 0) { throw "Pre-build validation failed" }
} catch {
    Write-Host "Pre-deployment checks failed: $_" -ForegroundColor Red
    exit 1
}

# Build application
Write-Host ""
Write-Host "Building application..." -ForegroundColor Yellow
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed" }
} catch {
    Write-Host "Build failed: $_" -ForegroundColor Red
    exit 1
}

# Build Docker image
Write-Host ""
Write-Host "Building Docker image..." -ForegroundColor Yellow
$imageTag = "$ECRRepository`:$Environment"
$localImage = "ai-med-backend:$Environment"

try {
    docker build -t $localImage .
    if ($LASTEXITCODE -ne 0) { throw "Docker build failed" }
    Write-Host "Docker image built: $localImage" -ForegroundColor Green
} catch {
    Write-Host "Docker build failed: $_" -ForegroundColor Red
    Write-Host "Make sure Docker is installed and running" -ForegroundColor Yellow
    exit 1
}

# Get AWS account ID
Write-Host ""
Write-Host "Getting AWS account ID..." -ForegroundColor Yellow
$accountId = (aws sts get-caller-identity --query Account --output text --region $Region)
$ecrUri = "$accountId.dkr.ecr.$Region.amazonaws.com/$ECRRepository"

# Login to ECR
Write-Host ""
Write-Host "Logging into Amazon ECR..." -ForegroundColor Yellow
try {
    aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $ecrUri
    if ($LASTEXITCODE -ne 0) { throw "ECR login failed" }
    Write-Host "ECR login successful" -ForegroundColor Green
} catch {
    Write-Host "ECR login failed. Creating repository if it doesn't exist..." -ForegroundColor Yellow
    try {
        aws ecr describe-repositories --repository-names $ECRRepository --region $Region 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Creating ECR repository..." -ForegroundColor Yellow
            aws ecr create-repository --repository-name $ECRRepository --region $Region --image-scanning-configuration scanOnPush=true
            Write-Host "ECR repository created" -ForegroundColor Green
        }
        aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $ecrUri
    } catch {
        Write-Host "Failed to create/login to ECR: $_" -ForegroundColor Red
        exit 1
    }
}

# Tag and push image
Write-Host ""
Write-Host "Tagging and pushing Docker image..." -ForegroundColor Yellow
$remoteImage = "$ecrUri`:$Environment"
$remoteImageLatest = "$ecrUri`:latest"

try {
    docker tag $localImage $remoteImage
    docker tag $localImage $remoteImageLatest
    docker push $remoteImage
    docker push $remoteImageLatest
    Write-Host "Image pushed to ECR: $remoteImage" -ForegroundColor Green
} catch {
    Write-Host "Failed to push image: $_" -ForegroundColor Red
    exit 1
}

# Deploy to ECS (if cluster exists)
Write-Host ""
Write-Host "Checking ECS cluster..." -ForegroundColor Yellow
try {
    $clusterExists = aws ecs describe-clusters --clusters $ECSCluster --region $Region --query 'clusters[0].status' --output text 2>&1
    if ($clusterExists -eq "ACTIVE") {
        Write-Host "ECS cluster found: $ECSCluster" -ForegroundColor Green
        
        Write-Host "Updating ECS service..." -ForegroundColor Yellow
        try {
            aws ecs update-service `
                --cluster $ECSCluster `
                --service $ECSService `
                --force-new-deployment `
                --region $Region `
                2>&1 | Out-Null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "ECS service update initiated" -ForegroundColor Green
                Write-Host "Deployment in progress. Check AWS Console for status." -ForegroundColor Yellow
            } else {
                Write-Host "Service update failed. Service may not exist yet." -ForegroundColor Yellow
                Write-Host "You may need to create the ECS service first." -ForegroundColor Yellow
            }
        } catch {
            Write-Host "Could not update ECS service: $_" -ForegroundColor Yellow
            Write-Host "Service may need to be created manually or via infrastructure as code" -ForegroundColor Yellow
        }
    } else {
        Write-Host "ECS cluster not found. Skipping ECS deployment." -ForegroundColor Yellow
        Write-Host "Image is available in ECR: $remoteImage" -ForegroundColor Green
        Write-Host "You can create ECS cluster and service using the provided CloudFormation template." -ForegroundColor Yellow
    }
} catch {
    Write-Host "Could not check ECS cluster: $_" -ForegroundColor Yellow
    Write-Host "Image is available in ECR: $remoteImage" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor White
Write-Host "Region: $Region" -ForegroundColor White
Write-Host "ECR Repository: $ECRRepository" -ForegroundColor White
Write-Host "Image URI: $remoteImage" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Image is available in ECR: $remoteImage" -ForegroundColor White
Write-Host "2. Create/update ECS service to use the new image" -ForegroundColor White
Write-Host "3. Or use the CloudFormation template to create infrastructure" -ForegroundColor White
Write-Host ""
Write-Host "Deployment completed!" -ForegroundColor Green
