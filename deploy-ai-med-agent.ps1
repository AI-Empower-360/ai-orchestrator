# Deploy AI Med Agent (ai-orchestrator) – build, Docker, ECR push
# Usage: .\deploy-ai-med-agent.ps1 [-Region us-east-1] [-Tag latest] [-SkipDocker]

param(
    [string]$Region = "us-east-1",
    [string]$Tag = "latest",
    [switch]$SkipDocker
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host "=== AI Med Agent (ai-orchestrator) deploy ===" -ForegroundColor Cyan

# 1. Build app
Set-Location $ProjectRoot
Write-Host "`n[1/4] npm run build..." -ForegroundColor Yellow
npm run build
if (-not $?) { throw "Build failed." }

# 2. Docker check
if ($SkipDocker) {
    Write-Host "`n[2/4] Skip Docker ( -SkipDocker )." -ForegroundColor Yellow
    Write-Host "Build complete. To push to ECR: install Docker, then run without -SkipDocker." -ForegroundColor Gray
    exit 0
}

$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Host "`n[2/4] Docker not found. Build succeeded." -ForegroundColor Yellow
    Write-Host "To push image: install Docker, then run:" -ForegroundColor Gray
    Write-Host "  docker build -t ai-med-agent-backend:$Tag ." -ForegroundColor Gray
    Write-Host "  aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin <account-id>.dkr.ecr.$Region.amazonaws.com" -ForegroundColor Gray
    Write-Host "  docker tag ai-med-agent-backend:$Tag <account-id>.dkr.ecr.$Region.amazonaws.com/ai-med-agent-backend:$Tag" -ForegroundColor Gray
    Write-Host "  docker push <account-id>.dkr.ecr.$Region.amazonaws.com/ai-med-agent-backend:$Tag" -ForegroundColor Gray
    exit 0
}

# 3. AWS account + ECR
Write-Host "`n[2/4] AWS account + ECR..." -ForegroundColor Yellow
$account = (aws sts get-caller-identity --query Account --output text 2>$null)
if (-not $account) { throw "AWS CLI not configured or no credentials. Run aws configure or aws sso login." }

$ecrUri = "$account.dkr.ecr.$Region.amazonaws.com/ai-med-agent-backend"
$image = "${ecrUri}:$Tag"

# 4. ECR login, build, tag, push
Write-Host "`n[3/4] Docker build..." -ForegroundColor Yellow
docker build -t "ai-med-agent-backend:$Tag" .
if (-not $?) { throw "Docker build failed." }

Write-Host "`n[4/4] ECR login, tag, push..." -ForegroundColor Yellow
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin "$account.dkr.ecr.$Region.amazonaws.com"
docker tag "ai-med-agent-backend:$Tag" $image
docker push $image

Write-Host "`nDone. Image pushed: $image" -ForegroundColor Green
Write-Host "Update ECS service to use this image, or run Terraform/CloudFormation deploy." -ForegroundColor Gray
