# Create IAM Roles for ECS Tasks
# These roles are required for ECS to pull images and run tasks

$ErrorActionPreference = 'Stop'

Write-Host "Creating IAM Roles for ECS..." -ForegroundColor Cyan

# Task Execution Role (for pulling images from ECR)
Write-Host "Creating ECS Task Execution Role..." -ForegroundColor Yellow

$executionRolePolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Principal = @{
                Service = "ecs-tasks.amazonaws.com"
            }
            Action = "sts:AssumeRole"
        }
    )
} | ConvertTo-Json

try {
    # Create role
    aws iam create-role `
        --role-name ecsTaskExecutionRole `
        --assume-role-policy-document $executionRolePolicy `
        --region us-east-1 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Role created" -ForegroundColor Green
    } else {
        Write-Host "Role may already exist" -ForegroundColor Yellow
    }
    
    # Attach managed policy
    aws iam attach-role-policy `
        --role-name ecsTaskExecutionRole `
        --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy `
        --region us-east-1
    
    Write-Host "Execution role configured" -ForegroundColor Green
} catch {
    Write-Host "Error creating execution role: $_" -ForegroundColor Yellow
}

# Task Role (for application permissions)
Write-Host "Creating ECS Task Role..." -ForegroundColor Yellow

$taskRolePolicy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Principal = @{
                Service = "ecs-tasks.amazonaws.com"
            }
            Action = "sts:AssumeRole"
        }
    )
} | ConvertTo-Json

try {
    # Create role
    aws iam create-role `
        --role-name ecsTaskRole `
        --assume-role-policy-document $taskRolePolicy `
        --region us-east-1 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Role created" -ForegroundColor Green
    } else {
        Write-Host "Role may already exist" -ForegroundColor Yellow
    }
    
    # Create and attach policy for CloudWatch Logs
    $logsPolicy = @{
        Version = "2012-10-17"
        Statement = @(
            @{
                Effect = "Allow"
                Action = @(
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                )
                Resource = "*"
            }
        )
    } | ConvertTo-Json
    
    aws iam put-role-policy `
        --role-name ecsTaskRole `
        --policy-name CloudWatchLogsPolicy `
        --policy-document $logsPolicy `
        --region us-east-1
    
    Write-Host "Task role configured" -ForegroundColor Green
} catch {
    Write-Host "Error creating task role: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "IAM Roles created/verified" -ForegroundColor Green
