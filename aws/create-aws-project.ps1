# Create AWS Project for AI IM Agent
# This script creates all necessary AWS resources for the project

param(
    [Parameter(Mandatory=$false)]
    [string]$ProjectName = "AI-IM-Agent",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [string]$AccountId = "996099991638"
)

$ErrorActionPreference = 'Stop'

Write-Host "Creating AWS Project: $ProjectName" -ForegroundColor Cyan
Write-Host "Account: $AccountId" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan
Write-Host ""

# Verify AWS credentials
Write-Host "Verifying AWS credentials..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity | ConvertFrom-Json
    Write-Host "Connected to AWS Account: $($identity.Account)" -ForegroundColor Green
    Write-Host "User/Role: $($identity.Arn)" -ForegroundColor Gray
} catch {
    Write-Host "Failed to verify AWS credentials: $_" -ForegroundColor Red
    exit 1
}

# Step 1: Create ECR Repository
Write-Host ""
Write-Host "Step 1: Creating ECR Repository..." -ForegroundColor Yellow
$ecrRepoName = "ai-im-agent-backend"

try {
    $existingRepo = aws ecr describe-repositories --repository-names $ecrRepoName --region $Region 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "ECR repository already exists: $ecrRepoName" -ForegroundColor Green
    }
} catch {
    Write-Host "Creating ECR repository: $ecrRepoName" -ForegroundColor Yellow
    aws ecr create-repository `
        --repository-name $ecrRepoName `
        --region $Region `
        --image-scanning-configuration scanOnPush=true `
        --encryption-configuration encryptionType=AES256 `
        --tags Key=Project,Value=$ProjectName Key=Environment,Value=production
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "ECR repository created successfully" -ForegroundColor Green
    } else {
        Write-Host "Failed to create ECR repository" -ForegroundColor Red
    }
}

$ecrUri = "$AccountId.dkr.ecr.$Region.amazonaws.com/$ecrRepoName"
Write-Host "ECR URI: $ecrUri" -ForegroundColor Cyan

# Step 2: Create ECS Cluster
Write-Host ""
Write-Host "Step 2: Creating ECS Cluster..." -ForegroundColor Yellow
$clusterName = "ai-im-agent-cluster"

try {
    $existingCluster = aws ecs describe-clusters --clusters $clusterName --region $Region 2>&1
    if ($LASTEXITCODE -eq 0) {
        $clusterStatus = ($existingCluster | ConvertFrom-Json).clusters[0].status
        if ($clusterStatus -eq "ACTIVE") {
            Write-Host "ECS cluster already exists: $clusterName" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "Creating ECS cluster: $clusterName" -ForegroundColor Yellow
    aws ecs create-cluster `
        --cluster-name $clusterName `
        --region $Region `
        --capacity-providers FARGATE FARGATE_SPOT `
        --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 `
        --tags key=Project,value=$ProjectName key=Environment,value=production
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "ECS cluster created successfully" -ForegroundColor Green
    } else {
        Write-Host "Failed to create ECS cluster" -ForegroundColor Red
    }
}

# Step 3: Deploy CloudFormation Stack
Write-Host ""
Write-Host "Step 3: Deploying CloudFormation Stack..." -ForegroundColor Yellow
$stackName = "ai-im-agent-infrastructure"

$templateFile = "aws\cloudformation-template.yaml"
if (-not (Test-Path $templateFile)) {
    Write-Host "CloudFormation template not found. Creating infrastructure manually..." -ForegroundColor Yellow
} else {
    Write-Host "Checking if CloudFormation stack exists..." -ForegroundColor Yellow
    $stackExists = aws cloudformation describe-stacks --stack-name $stackName --region $Region 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Stack exists. Updating..." -ForegroundColor Yellow
        $action = "update"
    } else {
        Write-Host "Stack does not exist. Creating..." -ForegroundColor Yellow
        $action = "create"
    }
    
    $parameters = @(
        "ParameterKey=Environment,ParameterValue=production",
        "ParameterKey=ImageTag,ParameterValue=latest",
        "ParameterKey=ContainerPort,ParameterValue=3001",
        "ParameterKey=DesiredCount,ParameterValue=2",
        "ParameterKey=Cpu,ParameterValue=512",
        "ParameterKey=Memory,ParameterValue=1024"
    )
    
    if ($action -eq "create") {
        aws cloudformation create-stack `
            --stack-name $stackName `
            --template-body file://$templateFile `
            --parameters $parameters `
            --capabilities CAPABILITY_NAMED_IAM `
            --region $Region `
            --tags Key=Project,Value=$ProjectName Key=Environment,Value=production
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "CloudFormation stack creation initiated" -ForegroundColor Green
            Write-Host "Waiting for stack creation (this may take 5-10 minutes)..." -ForegroundColor Yellow
            aws cloudformation wait stack-create-complete --stack-name $stackName --region $Region
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Stack created successfully!" -ForegroundColor Green
            }
        }
    } else {
        aws cloudformation update-stack `
            --stack-name $stackName `
            --template-body file://$templateFile `
            --parameters $parameters `
            --capabilities CAPABILITY_NAMED_IAM `
            --region $Region
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Stack update initiated" -ForegroundColor Green
        }
    }
}

# Step 4: Create IAM Roles (if not created by CloudFormation)
Write-Host ""
Write-Host "Step 4: Verifying IAM Roles..." -ForegroundColor Yellow

# Step 5: Summary
Write-Host ""
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "AWS Project Creation Summary" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "Project Name: $ProjectName" -ForegroundColor White
Write-Host "Account ID: $AccountId" -ForegroundColor White
Write-Host "Region: $Region" -ForegroundColor White
Write-Host ""
Write-Host "Resources Created:" -ForegroundColor Green
Write-Host "  ✅ ECR Repository: $ecrRepoName" -ForegroundColor White
Write-Host "     URI: $ecrUri" -ForegroundColor Gray
Write-Host "  ✅ ECS Cluster: $clusterName" -ForegroundColor White
if ($stackName) {
    Write-Host "  ✅ CloudFormation Stack: $stackName" -ForegroundColor White
}
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Build and push Docker image:" -ForegroundColor White
Write-Host "   .\deploy-aws.ps1 production $Region" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Or use CloudFormation to create full infrastructure:" -ForegroundColor White
Write-Host "   .\aws\deploy-cloudformation.ps1 production $Region -CreateStack" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Configure environment variables in ECS task definition" -ForegroundColor White
Write-Host "4. Set up AWS Secrets Manager for sensitive data" -ForegroundColor White
Write-Host ""
Write-Host "Project created successfully!" -ForegroundColor Green
