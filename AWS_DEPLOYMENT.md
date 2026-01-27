# AWS Deployment Guide - AI Med Backend

Complete guide for deploying AI Med Backend to AWS using ECS Fargate.

## Prerequisites

1. **AWS CLI** installed and configured
   ```bash
   aws --version
   aws configure
   ```

2. **Docker** installed and running
   ```bash
   docker --version
   ```

3. **AWS Account** with appropriate permissions:
   - ECR (Elastic Container Registry)
   - ECS (Elastic Container Service)
   - VPC, Subnets, Security Groups
   - IAM roles and policies
   - CloudFormation (optional)

## Quick Start

### Option 1: Automated Deployment Script

```powershell
# Deploy to production
.\deploy-aws.ps1 production us-east-1

# Deploy to staging
.\deploy-aws.ps1 staging us-east-1

# Deploy to dev
.\deploy-aws.ps1 dev us-east-1
```

This script will:
1. ✅ Validate and build the application
2. ✅ Build Docker image
3. ✅ Push to Amazon ECR
4. ✅ Update ECS service (if exists)

### Option 2: CloudFormation Deployment

```powershell
# Create infrastructure and deploy
.\aws\deploy-cloudformation.ps1 production us-east-1 -CreateStack

# Update existing stack
.\aws\deploy-cloudformation.ps1 production us-east-1
```

## Step-by-Step Manual Deployment

### Step 1: Build and Push Docker Image

```powershell
# Build Docker image
docker build -t ai-med-backend:production .

# Get AWS account ID
$accountId = aws sts get-caller-identity --query Account --output text
$region = "us-east-1"
$ecrUri = "$accountId.dkr.ecr.$region.amazonaws.com/ai-med-backend"

# Login to ECR
aws ecr get-login-password --region $region | docker login --username AWS --password-stdin $ecrUri

# Create ECR repository (if doesn't exist)
aws ecr create-repository --repository-name ai-med-backend --region $region

# Tag and push
docker tag ai-med-backend:production $ecrUri:production
docker tag ai-med-backend:production $ecrUri:latest
docker push $ecrUri:production
docker push $ecrUri:latest
```

### Step 2: Create ECS Infrastructure

#### Option A: Using CloudFormation (Recommended)

```powershell
.\aws\deploy-cloudformation.ps1 production us-east-1 -CreateStack
```

#### Option B: Manual Setup via AWS Console

1. **Create ECS Cluster**
   - Go to ECS → Clusters → Create Cluster
   - Name: `ai-med-cluster`
   - Infrastructure: AWS Fargate

2. **Create Task Definition**
   - Go to ECS → Task Definitions → Create new Task Definition
   - Family: `ai-med-backend`
   - Launch type: Fargate
   - CPU: 512 (0.5 vCPU)
   - Memory: 1024 MB
   - Container:
     - Image: `{account-id}.dkr.ecr.us-east-1.amazonaws.com/ai-med-backend:production`
     - Port: 3001
     - Environment variables:
       - `NODE_ENV=production`
       - `PORT=3001`
       - `FRONTEND_URL=https://aimed.ai`
       - `JWT_SECRET={from-secrets-manager}`

3. **Create ECS Service**
   - Cluster: `ai-med-cluster`
   - Service name: `ai-med-backend-service`
   - Task definition: `ai-med-backend`
   - Desired tasks: 2
   - VPC: Your VPC
   - Subnets: Private subnets
   - Security group: Allow port 3001 from ALB
   - Load balancer: Application Load Balancer
   - Target group: Health check on `/health`

### Step 3: Configure Environment Variables

#### Using AWS Secrets Manager (Recommended)

```powershell
# Create secrets
aws secretsmanager create-secret `
    --name ai-med-backend/production/jwt-secret `
    --secret-string "your-production-jwt-secret-32-chars-min"

aws secretsmanager create-secret `
    --name ai-med-backend/production/openai-key `
    --secret-string "your-openai-api-key"
```

Update task definition to use secrets:
```json
{
  "secrets": [
    {
      "name": "JWT_SECRET",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:ai-med-backend/production/jwt-secret"
    },
    {
      "name": "OPENAI_API_KEY",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:ai-med-backend/production/openai-key"
    }
  ]
}
```

#### Using Environment Variables (Simple)

Add to ECS Task Definition:
- `NODE_ENV=production`
- `PORT=3001`
- `FRONTEND_URL=https://aimed.ai`
- `API_URL=https://api.aimed.ai`
- `JWT_SECRET={your-secret}`
- `OPENAI_API_KEY={your-key}` (optional)
- `AWS_REGION=us-east-1`
- `TRANSCRIPTION_PROVIDER=aws-transcribe` (if using AWS)

## Architecture

### ECS Fargate Setup

```
Internet
   │
   ▼
Application Load Balancer (Public)
   │
   ▼
ECS Service (Private Subnets)
   │
   ├── Task 1 (Fargate)
   │   └── Container: ai-med-backend:3001
   │
   └── Task 2 (Fargate)
       └── Container: ai-med-backend:3001
```

### Network Configuration

- **Public Subnets**: ALB only
- **Private Subnets**: ECS tasks
- **Security Groups**:
  - ALB: Allow 80, 443 from internet
  - ECS: Allow 3001 from ALB security group

## Environment-Specific Configurations

### Development

```powershell
.\deploy-aws.ps1 dev us-east-1
```

- CPU: 256 (0.25 vCPU)
- Memory: 512 MB
- Desired tasks: 1
- Cost: ~$10-15/month

### Staging

```powershell
.\deploy-aws.ps1 staging us-east-1
```

- CPU: 512 (0.5 vCPU)
- Memory: 1024 MB
- Desired tasks: 1-2
- Cost: ~$30-50/month

### Production

```powershell
.\deploy-aws.ps1 production us-east-1
```

- CPU: 1024 (1 vCPU)
- Memory: 2048 MB
- Desired tasks: 2-4
- Cost: ~$80-150/month

## Monitoring and Logging

### CloudWatch Logs

Logs are automatically sent to CloudWatch:
- Log Group: `/ecs/ai-med-backend-{environment}`
- Retention: 7 days (configurable)

### CloudWatch Metrics

Monitor:
- CPU utilization
- Memory utilization
- Request count
- Error rate
- Target response time

### Health Checks

- **ALB Health Check**: `/health`
- **ECS Health Check**: Container health check
- **Readiness**: `/health/readiness`
- **Liveness**: `/health/liveness`

## Scaling

### Auto Scaling

Configure ECS Service Auto Scaling:

```powershell
aws application-autoscaling register-scalable-target `
    --service-namespace ecs `
    --resource-id service/ai-med-cluster/ai-med-backend-service `
    --scalable-dimension ecs:service:DesiredCount `
    --min-capacity 2 `
    --max-capacity 10

aws application-autoscaling put-scaling-policy `
    --service-namespace ecs `
    --resource-id service/ai-med-cluster/ai-med-backend-service `
    --scalable-dimension ecs:service:DesiredCount `
    --policy-name cpu-scaling `
    --policy-type TargetTrackingScaling `
    --target-tracking-scaling-policy-configuration '{
        "TargetValue": 70.0,
        "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
        }
    }'
```

## Cost Optimization

1. **Use Fargate Spot** for non-production
2. **Right-size** CPU and memory
3. **Enable auto-scaling** to scale down during low traffic
4. **Use CloudWatch Insights** to optimize
5. **Reserve capacity** for production (if predictable)

## Troubleshooting

### Container fails to start

```powershell
# Check ECS service events
aws ecs describe-services --cluster ai-med-cluster --services ai-med-backend-service

# Check CloudWatch logs
aws logs tail /ecs/ai-med-backend-production --follow
```

### Health check failures

1. Verify security group allows ALB → ECS
2. Check container logs for errors
3. Verify `/health` endpoint responds
4. Check task definition health check configuration

### Image pull errors

1. Verify ECR repository exists
2. Check IAM task execution role has ECR permissions
3. Verify image tag is correct

## Rollback

### Rollback to previous image

```powershell
# Update service to use previous image tag
aws ecs update-service `
    --cluster ai-med-cluster `
    --service ai-med-backend-service `
    --task-definition ai-med-backend:previous-version `
    --force-new-deployment
```

## Security Best Practices

1. ✅ Use AWS Secrets Manager for sensitive data
2. ✅ Run tasks in private subnets
3. ✅ Use least-privilege IAM roles
4. ✅ Enable VPC Flow Logs
5. ✅ Use HTTPS/SSL for ALB
6. ✅ Enable CloudTrail for audit
7. ✅ Regular security updates
8. ✅ Enable ECR image scanning

## Related Files

- `Dockerfile` - Docker image configuration
- `deploy-aws.ps1` - Automated deployment script
- `aws/cloudformation-template.yaml` - Infrastructure as code
- `aws/deploy-cloudformation.ps1` - CloudFormation deployment
- `DEPLOYMENT.md` - General deployment guide

## Next Steps

1. ✅ Run `.\deploy-aws.ps1 production` to deploy
2. ✅ Configure environment variables/secrets
3. ✅ Set up monitoring and alerts
4. ✅ Configure auto-scaling
5. ✅ Set up CI/CD pipeline

---

**Ready to deploy to AWS!** 🚀
