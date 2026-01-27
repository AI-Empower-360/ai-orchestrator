# Create AWS CodeBuild Project for AI IM Agent Backend
# This script creates a CodeBuild project that builds and pushes Docker images to ECR

param(
    [string]$ProjectName = "ai-im-agent-backend-build",
    [string]$Region = "us-east-1",
    [string]$AccountId = "996099991638",
    [string]$GitHubRepo = "AI-Empower-360/ai-orchestrator",
    [string]$Branch = "main"
)

$ErrorActionPreference = 'Stop'

Write-Host "Creating AWS CodeBuild Project..." -ForegroundColor Cyan
Write-Host "Project Name: $ProjectName" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "GitHub Repo: $GitHubRepo" -ForegroundColor Yellow
Write-Host "Branch: $Branch" -ForegroundColor Yellow
Write-Host ""

# Check if CodeBuild service role exists, create if not
$ServiceRoleName = "codebuild-ai-im-agent-service-role"
$ServiceRoleArn = "arn:aws:iam::${AccountId}:role/${ServiceRoleName}"

Write-Host "Checking IAM service role..." -ForegroundColor Yellow

try {
    aws iam get-role --role-name $ServiceRoleName --region $Region 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Creating IAM service role..." -ForegroundColor Yellow
        
        # Trust policy for CodeBuild
        $trustPolicy = @{
            Version = "2012-10-17"
            Statement = @(
                @{
                    Effect = "Allow"
                    Principal = @{
                        Service = "codebuild.amazonaws.com"
                    }
                    Action = "sts:AssumeRole"
                }
            )
        } | ConvertTo-Json -Compress
        
        # Create role
        aws iam create-role `
            --role-name $ServiceRoleName `
            --assume-role-policy-document $trustPolicy `
            --region $Region | Out-Null
        
        # Attach policies
        Write-Host "Attaching policies to service role..." -ForegroundColor Yellow
        
        # ECR permissions
        $ecrPolicy = @{
            Version = "2012-10-17"
            Statement = @(
                @{
                    Effect = "Allow"
                    Action = @(
                        "ecr:GetAuthorizationToken",
                        "ecr:BatchCheckLayerAvailability",
                        "ecr:GetDownloadUrlForLayer",
                        "ecr:BatchGetImage",
                        "ecr:PutImage",
                        "ecr:InitiateLayerUpload",
                        "ecr:UploadLayerPart",
                        "ecr:CompleteLayerUpload"
                    )
                    Resource = "*"
                }
            )
        } | ConvertTo-Json -Compress
        
        aws iam put-role-policy `
            --role-name $ServiceRoleName `
            --policy-name CodeBuildECRPolicy `
            --policy-document $ecrPolicy `
            --region $Region | Out-Null
        
        # CloudWatch Logs permissions
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
                    Resource = "arn:aws:logs:${Region}:${AccountId}:log-group:/aws/codebuild/${ProjectName}*"
                }
            )
        } | ConvertTo-Json -Compress
        
        aws iam put-role-policy `
            --role-name $ServiceRoleName `
            --policy-name CodeBuildLogsPolicy `
            --policy-document $logsPolicy `
            --region $Region | Out-Null
        
        # ECS permissions (for updating service)
        $ecsPolicy = @{
            Version = "2012-10-17"
            Statement = @(
                @{
                    Effect = "Allow"
                    Action = @(
                        "ecs:UpdateService",
                        "ecs:DescribeServices"
                    )
                    Resource = "arn:aws:ecs:${Region}:${AccountId}:service/ai-im-agent-cluster/*"
                }
            )
        } | ConvertTo-Json -Compress
        
        aws iam put-role-policy `
            --role-name $ServiceRoleName `
            --policy-name CodeBuildECSPolicy `
            --policy-document $ecsPolicy `
            --region $Region | Out-Null
        
        Write-Host "Service role created successfully" -ForegroundColor Green
    } else {
        Write-Host "Service role already exists" -ForegroundColor Green
    }
} catch {
    Write-Host "Error checking/creating service role: $_" -ForegroundColor Yellow
}

# Create CloudWatch Log Group
Write-Host "Creating CloudWatch Log Group..." -ForegroundColor Yellow
$logGroupName = "/aws/codebuild/$ProjectName"

try {
    aws logs create-log-group --log-group-name $logGroupName --region $Region 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Log group created" -ForegroundColor Green
    } else {
        Write-Host "Log group may already exist" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Log group creation skipped" -ForegroundColor Yellow
}

# Create CodeBuild project configuration
Write-Host "Creating CodeBuild project..." -ForegroundColor Yellow

$projectConfig = @{
    name = $ProjectName
    description = "Build and deploy AI IM Agent Backend to ECR"
    source = @{
        type = "GITHUB"
        location = "https://github.com/$GitHubRepo.git"
        buildspec = "buildspec.yml"
        gitCloneDepth = 1
    }
    artifacts = @{
        type = "NO_ARTIFACTS"
    }
    environment = @{
        type = "LINUX_CONTAINER"
        image = "aws/codebuild/standard:7.0"
        computeType = "BUILD_GENERAL1_MEDIUM"
        privilegedMode = $true
        environmentVariables = @(
            @{
                name = "AWS_DEFAULT_REGION"
                value = $Region
            },
            @{
                name = "AWS_ACCOUNT_ID"
                value = $AccountId
            },
            @{
                name = "IMAGE_REPO_NAME"
                value = "ai-im-agent-backend"
            },
            @{
                name = "IMAGE_TAG"
                value = "production"
            },
            @{
                name = "UPDATE_ECS_SERVICE"
                value = "true"
            }
        )
    }
    serviceRole = $ServiceRoleArn
    logsConfig = @{
        cloudWatchLogs = @{
            status = "ENABLED"
            groupName = $logGroupName
        }
    }
} | ConvertTo-Json -Depth 10

# Save config to temp file
$configFile = "$env:TEMP\codebuild-project-config.json"
$projectConfig | Out-File -FilePath $configFile -Encoding utf8

try {
    # Check if project exists
    aws codebuild describe-projects --names $ProjectName --region $Region 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Updating existing CodeBuild project..." -ForegroundColor Yellow
        aws codebuild update-project --cli-input-json "file://$configFile" --region $Region
        Write-Host "Project updated successfully" -ForegroundColor Green
    } else {
        Write-Host "Creating new CodeBuild project..." -ForegroundColor Yellow
        aws codebuild create-project --cli-input-json "file://$configFile" --region $Region
        Write-Host "Project created successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "Error creating/updating project: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clean up temp file
    if (Test-Path $configFile) {
        Remove-Item $configFile
    }
}

# Create webhook for automatic builds on push (optional)
Write-Host ""
Write-Host "Setting up GitHub webhook (requires GitHub token)..." -ForegroundColor Yellow
Write-Host "To enable automatic builds on push, you need to:" -ForegroundColor Yellow
Write-Host "1. Create a GitHub Personal Access Token with 'repo' and 'admin:repo_hook' permissions" -ForegroundColor White
Write-Host "2. Run: aws codebuild create-webhook --project-name $ProjectName --filter-groups '[[{\"type\":\"EVENT\",\"pattern\":\"PUSH\"},{\"type\":\"HEAD_REF\",\"pattern\":\"^refs/heads/$Branch$\"}]]' --region $Region" -ForegroundColor White
Write-Host ""

Write-Host "CodeBuild Project Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start a build: aws codebuild start-build --project-name $ProjectName --region $Region" -ForegroundColor White
Write-Host "2. View builds: https://console.aws.amazon.com/codesuite/codebuild/projects/$ProjectName/builds?region=$Region" -ForegroundColor White
Write-Host "3. Or trigger builds automatically on git push (see webhook instructions above)" -ForegroundColor White
