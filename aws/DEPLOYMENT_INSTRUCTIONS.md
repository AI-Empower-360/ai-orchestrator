# AWS Deployment Instructions - AI IM Agent

## Current Status

✅ **AWS Resources Created:**
- ECR Repository: `ai-im-agent-backend`
- ECS Cluster: `ai-im-agent-cluster`
- CloudWatch Log Group: `/ecs/ai-im-agent-backend`
- AWS Account: 996099991638 (2026Paka)
- Region: us-east-1

## Prerequisites

### 1. Install Docker

**Windows:**
- Download Docker Desktop: https://www.docker.com/products/docker-desktop
- Install and start Docker Desktop
- Verify: `docker --version`

**Alternative (if Docker not available):**
- Use AWS CodeBuild to build and push images
- Or build on an EC2 instance with Docker

### 2. Verify AWS CLI

```powershell
aws --version
aws sts get-caller-identity
```

## Deployment Steps

### Step 1: Create IAM Roles

```powershell
.\aws\create-iam-roles.ps1
```

This creates:
- `ecsTaskExecutionRole` - For pulling images from ECR
- `ecsTaskRole` - For application permissions

### Step 2: Build and Push Docker Image

```powershell
# Build application
npm run build

# Build Docker image
docker build -t ai-im-agent-backend:production .

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 996099991638.dkr.ecr.us-east-1.amazonaws.com

# Tag and push
docker tag ai-im-agent-backend:production 996099991638.dkr.ecr.us-east-1.amazonaws.com/ai-im-agent-backend:production
docker tag ai-im-agent-backend:production 996099991638.dkr.ecr.us-east-1.amazonaws.com/ai-im-agent-backend:latest
docker push 996099991638.dkr.ecr.us-east-1.amazonaws.com/ai-im-agent-backend:production
docker push 996099991638.dkr.ecr.us-east-1.amazonaws.com/ai-im-agent-backend:latest
```

### Step 3: Register Task Definition

```powershell
aws ecs register-task-definition --cli-input-json file://aws\task-definition.json --region us-east-1
```

### Step 4: Create ECS Service

**Option A: Using CloudFormation (Recommended - Creates Full Infrastructure)**

```powershell
.\aws\deploy-cloudformation.ps1 production us-east-1 -CreateStack
```

This creates:
- VPC with subnets
- Application Load Balancer
- Security Groups
- ECS Service
- All networking

**Option B: Manual Service Creation**

First, you need:
- VPC and subnets (or use default)
- Security group allowing port 3001
- Application Load Balancer (optional but recommended)

Then create service:
```powershell
aws ecs create-service `
    --cluster ai-im-agent-cluster `
    --service-name ai-im-agent-backend-service `
    --task-definition ai-im-agent-backend `
    --desired-count 2 `
    --launch-type FARGATE `
    --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" `
    --region us-east-1
```

## Quick Deploy (Once Docker is Installed)

```powershell
.\deploy-aws.ps1 production us-east-1
```

## Alternative: Deploy Without Docker Locally

### Option 1: Use AWS CodeBuild

Create a `buildspec.yml`:

```yaml
version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 996099991638.dkr.ecr.us-east-1.amazonaws.com
  build:
    commands:
      - echo Build started on `date`
      - npm install
      - npm run build
      - docker build -t ai-im-agent-backend:production .
      - docker tag ai-im-agent-backend:production 996099991638.dkr.ecr.us-east-1.amazonaws.com/ai-im-agent-backend:production
  post_build:
    commands:
      - echo Build completed on `date`
      - docker push 996099991638.dkr.ecr.us-east-1.amazonaws.com/ai-im-agent-backend:production
```

### Option 2: Use EC2 Instance

1. Launch EC2 instance with Docker
2. SSH into instance
3. Clone repository
4. Build and push from EC2

### Option 3: Use GitHub Actions

Create `.github/workflows/deploy-aws.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - name: Login to ECR
        run: |
          aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 996099991638.dkr.ecr.us-east-1.amazonaws.com
      - name: Build and push
        run: |
          docker build -t ai-im-agent-backend:production .
          docker tag ai-im-agent-backend:production 996099991638.dkr.ecr.us-east-1.amazonaws.com/ai-im-agent-backend:production
          docker push 996099991638.dkr.ecr.us-east-1.amazonaws.com/ai-im-agent-backend:production
      - name: Update ECS service
        run: |
          aws ecs update-service --cluster ai-im-agent-cluster --service ai-im-agent-backend-service --force-new-deployment --region us-east-1
```

## Environment Variables

Set these in the task definition or use AWS Secrets Manager:

### Required
- `NODE_ENV=production`
- `PORT=3001`
- `JWT_SECRET` (use Secrets Manager)
- `FRONTEND_URL=https://aimed.ai`
- `API_URL=https://api.aimed.ai`

### Optional
- `OPENAI_API_KEY` (use Secrets Manager)
- `AWS_REGION=us-east-1`
- `TRANSCRIPTION_PROVIDER=aws-transcribe`

## Using AWS Secrets Manager

```powershell
# Create secrets
aws secretsmanager create-secret `
    --name ai-im-agent-backend/jwt-secret `
    --secret-string "your-production-jwt-secret-32-chars-min" `
    --region us-east-1

aws secretsmanager create-secret `
    --name ai-im-agent-backend/openai-key `
    --secret-string "your-openai-api-key" `
    --region us-east-1
```

Then update task definition to reference secrets:
```json
"secrets": [
  {
    "name": "JWT_SECRET",
    "valueFrom": "arn:aws:secretsmanager:us-east-1:996099991638:secret:ai-im-agent-backend/jwt-secret"
  }
]
```

## Verify Deployment

```powershell
# Check service status
aws ecs describe-services --cluster ai-im-agent-cluster --services ai-im-agent-backend-service --region us-east-1

# Check running tasks
aws ecs list-tasks --cluster ai-im-agent-cluster --region us-east-1

# View logs
aws logs tail /ecs/ai-im-agent-backend --follow --region us-east-1
```

## Next Steps

1. **Install Docker Desktop** (if not installed)
2. **Run**: `.\aws\create-iam-roles.ps1`
3. **Build and push**: Follow Step 2 above
4. **Deploy**: Use CloudFormation or create service manually
5. **Configure**: Set environment variables/secrets
6. **Verify**: Check service status and logs

---

**Status**: ✅ AWS Project Created - Ready for Docker Build and Deployment
