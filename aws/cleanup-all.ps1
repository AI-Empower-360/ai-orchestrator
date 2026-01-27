# Comprehensive AWS Resource Cleanup Script
# Deletes all resources created for AI IM Agent Backend

param(
    [string]$Region = "us-east-1",
    [switch]$Force = $false
)

$ErrorActionPreference = 'Stop'

Write-Host "========================================" -ForegroundColor Red
Write-Host "AWS RESOURCE CLEANUP" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""

if (-not $Force) {
    $confirm = Read-Host "This will DELETE ALL resources. Are you sure? (type 'yes' to continue)"
    if ($confirm -ne "yes") {
        Write-Host "Cleanup cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "Starting cleanup..." -ForegroundColor Yellow
Write-Host ""

# 1. Delete Lambda Function and Function URL
Write-Host "1. Deleting Lambda function..." -ForegroundColor Cyan
try {
    $lambdaName = "github-webhook-handler"
    # Delete Function URL first
    aws lambda delete-function-url-config --function-name $lambdaName --region $Region 2>&1 | Out-Null
    # Delete function
    aws lambda delete-function --function-name $lambdaName --region $Region 2>&1 | Out-Null
    Write-Host "   ✅ Lambda function deleted" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Lambda function may not exist" -ForegroundColor Yellow
}

# 2. Delete CodeBuild Project
Write-Host "2. Deleting CodeBuild project..." -ForegroundColor Cyan
try {
    aws codebuild delete-project --name ai-im-agent-backend-build --region $Region 2>&1 | Out-Null
    Write-Host "   ✅ CodeBuild project deleted" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  CodeBuild project may not exist" -ForegroundColor Yellow
}

# 3. Delete CodePipeline
Write-Host "3. Deleting CodePipeline..." -ForegroundColor Cyan
try {
    aws codepipeline delete-pipeline --name ai-im-agent-backend-pipeline --region $Region 2>&1 | Out-Null
    Write-Host "   ✅ CodePipeline deleted" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  CodePipeline may not exist" -ForegroundColor Yellow
}

# 4. Delete ECS Service
Write-Host "4. Deleting ECS service..." -ForegroundColor Cyan
try {
    $clusterName = "ai-im-agent-cluster"
    $serviceName = "ai-im-agent-backend-service"
    
    # Update service to 0 tasks
    aws ecs update-service --cluster $clusterName --service $serviceName --desired-count 0 --region $Region 2>&1 | Out-Null
    Start-Sleep -Seconds 10
    
    # Delete service
    aws ecs delete-service --cluster $clusterName --service $serviceName --force --region $Region 2>&1 | Out-Null
    Write-Host "   ✅ ECS service deleted" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  ECS service may not exist" -ForegroundColor Yellow
}

# 5. Delete ECS Cluster
Write-Host "5. Deleting ECS cluster..." -ForegroundColor Cyan
try {
    aws ecs delete-cluster --cluster ai-im-agent-cluster --region $Region 2>&1 | Out-Null
    Write-Host "   ✅ ECS cluster deleted" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  ECS cluster may not exist" -ForegroundColor Yellow
}

# 6. Delete ECR Repository (and all images)
Write-Host "6. Deleting ECR repository..." -ForegroundColor Cyan
try {
    $repoName = "ai-im-agent-backend"
    
    # Delete all images first
    $images = aws ecr list-images --repository-name $repoName --region $Region --query 'imageIds[*]' --output json 2>&1 | ConvertFrom-Json
    if ($images -and $images.Count -gt 0) {
        aws ecr batch-delete-image --repository-name $repoName --image-ids imageIds=$($images | ConvertTo-Json -Compress) --region $Region 2>&1 | Out-Null
    }
    
    # Delete repository
    aws ecr delete-repository --repository-name $repoName --force --region $Region 2>&1 | Out-Null
    Write-Host "   ✅ ECR repository deleted" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  ECR repository may not exist" -ForegroundColor Yellow
}

# 7. Delete S3 Buckets
Write-Host "7. Deleting S3 buckets..." -ForegroundColor Cyan
$buckets = @(
    "996099991638-codepipeline-artifacts",
    "996099991638-codepipeline-artifacts-us-east-1",
    "ai-im-agent-backend-codebuild-artifacts-996099991638",
    "ai-im-agent-backend-pipeline-artifacts-996099991638"
)

foreach ($bucket in $buckets) {
    try {
        # Delete all objects
        aws s3 rm s3://$bucket --recursive --region $Region 2>&1 | Out-Null
        # Delete bucket
        aws s3api delete-bucket --bucket $bucket --region $Region 2>&1 | Out-Null
        Write-Host "   ✅ S3 bucket deleted: $bucket" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  S3 bucket may not exist: $bucket" -ForegroundColor Yellow
    }
}

# 8. Delete CloudWatch Log Groups
Write-Host "8. Deleting CloudWatch log groups..." -ForegroundColor Cyan
$logGroups = @(
    "/aws/lambda/github-webhook-handler",
    "/aws/codebuild/ai-im-agent-backend-build",
    "/ecs/ai-im-agent-backend"
)

foreach ($logGroup in $logGroups) {
    try {
        aws logs delete-log-group --log-group-name $logGroup --region $Region 2>&1 | Out-Null
        Write-Host "   ✅ Log group deleted: $logGroup" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Log group may not exist: $logGroup" -ForegroundColor Yellow
    }
}

# 9. Delete IAM Roles
Write-Host "9. Deleting IAM roles..." -ForegroundColor Cyan
$roles = @(
    "lambda-github-webhook-role",
    "codebuild-ai-im-agent-service-role",
    "codebuild-ai-im-agent-pipeline-role",
    "codepipeline-ai-im-agent-role",
    "ecsTaskExecutionRole",
    "ecsTaskRole"
)

foreach ($role in $roles) {
    try {
        # Detach policies
        $policies = aws iam list-attached-role-policies --role-name $role --query 'AttachedPolicies[].PolicyArn' --output text 2>&1
        if ($policies) {
            $policies.Split("`t") | ForEach-Object {
                if ($_) {
                    aws iam detach-role-policy --role-name $role --policy-arn $_ 2>&1 | Out-Null
                }
            }
        }
        
        # Delete inline policies
        $inlinePolicies = aws iam list-role-policies --role-name $role --query 'PolicyNames[]' --output text 2>&1
        if ($inlinePolicies) {
            $inlinePolicies.Split("`t") | ForEach-Object {
                if ($_) {
                    aws iam delete-role-policy --role-name $role --policy-name $_ 2>&1 | Out-Null
                }
            }
        }
        
        # Delete role
        aws iam delete-role --role-name $role 2>&1 | Out-Null
        Write-Host "   ✅ IAM role deleted: $role" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  IAM role may not exist: $role" -ForegroundColor Yellow
    }
}

# 10. Delete Secrets Manager secrets
Write-Host "10. Deleting Secrets Manager secrets..." -ForegroundColor Cyan
$secrets = @(
    "codebuild/github-token",
    "github/webhook-secret"
)

foreach ($secret in $secrets) {
    try {
        aws secretsmanager delete-secret --secret-id $secret --force-delete-without-recovery --region $Region 2>&1 | Out-Null
        Write-Host "   ✅ Secret deleted: $secret" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Secret may not exist: $secret" -ForegroundColor Yellow
    }
}

# 11. Delete CloudFormation stacks
Write-Host "11. Deleting CloudFormation stacks..." -ForegroundColor Cyan
$stacks = @(
    "lambda-github-webhook",
    "cicd-pipeline"
)

foreach ($stack in $stacks) {
    try {
        aws cloudformation delete-stack --stack-name $stack --region $Region 2>&1 | Out-Null
        Write-Host "   ✅ Stack deletion initiated: $stack" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Stack may not exist: $stack" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ CLEANUP COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Some resources may take a few minutes to fully delete." -ForegroundColor Yellow
Write-Host "Check AWS Console to verify all resources are deleted." -ForegroundColor White
Write-Host ""
Write-Host "Remaining resources to check manually:" -ForegroundColor Yellow
Write-Host "  - VPC and networking (if created via CloudFormation)" -ForegroundColor White
Write-Host "  - Application Load Balancer (if created)" -ForegroundColor White
Write-Host "  - Security Groups (if created)" -ForegroundColor White
Write-Host "  - GitHub CodeStar Connection (delete in Console)" -ForegroundColor White
