# AWS Project Created - AI IM Agent

## Project Information

- **Project Name**: AI IM Agent
- **AWS Account ID**: 996099991638
- **Account Name**: 2026Paka
- **Region**: us-east-1
- **Status**: ✅ Created

## Resources Created

### ✅ ECR Repository
- **Name**: `ai-im-agent-backend`
- **URI**: `996099991638.dkr.ecr.us-east-1.amazonaws.com/ai-im-agent-backend`
- **Image Scanning**: Enabled
- **Encryption**: AES256

### ✅ ECS Cluster
- **Name**: `ai-im-agent-cluster`
- **Status**: ACTIVE
- **Capacity Providers**: FARGATE, FARGATE_SPOT
- **Tags**: Project=AI-IM-Agent, Environment=production

## Next Steps

### 1. Build and Push Docker Image

```powershell
# Build the application
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

### 2. Create ECS Task Definition

```powershell
# Create task definition JSON
$taskDef = @{
    family = "ai-im-agent-backend"
    networkMode = "awsvpc"
    requiresCompatibilities = @("FARGATE")
    cpu = "512"
    memory = "1024"
    executionRoleArn = "arn:aws:iam::996099991638:role/ecsTaskExecutionRole"
    taskRoleArn = "arn:aws:iam::996099991638:role/ecsTaskRole"
    containerDefinitions = @(
        @{
            name = "ai-im-agent-backend"
            image = "996099991638.dkr.ecr.us-east-1.amazonaws.com/ai-im-agent-backend:production"
            portMappings = @(
                @{
                    containerPort = 3001
                    protocol = "tcp"
                }
            )
            environment = @(
                @{ name = "NODE_ENV"; value = "production" }
                @{ name = "PORT"; value = "3001" }
                @{ name = "FRONTEND_URL"; value = "https://aimed.ai" }
                @{ name = "API_URL"; value = "https://api.aimed.ai" }
            )
            logConfiguration = @{
                logDriver = "awslogs"
                options = @{
                    "awslogs-group" = "/ecs/ai-im-agent-backend"
                    "awslogs-region" = "us-east-1"
                    "awslogs-stream-prefix" = "ecs"
                }
            }
            healthCheck = @{
                command = @(
                    "CMD-SHELL",
                    "node -e `"require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})`""
                )
                interval = 30
                timeout = 5
                retries = 3
                startPeriod = 60
            }
        }
    )
} | ConvertTo-Json -Depth 10

$taskDef | Out-File -FilePath "aws\task-definition.json" -Encoding utf8

# Register task definition
aws ecs register-task-definition --cli-input-json file://aws\task-definition.json --region us-east-1
```

### 3. Create CloudWatch Log Group

```powershell
aws logs create-log-group --log-group-name /ecs/ai-im-agent-backend --region us-east-1
```

### 4. Deploy CloudFormation Stack (Optional - Full Infrastructure)

```powershell
.\aws\deploy-cloudformation.ps1 production us-east-1 -CreateStack
```

This will create:
- VPC with public/private subnets
- Application Load Balancer
- Security Groups
- ECS Service
- IAM Roles
- CloudWatch Log Groups

### 5. Create ECS Service (If not using CloudFormation)

```powershell
aws ecs create-service `
    --cluster ai-im-agent-cluster `
    --service-name ai-im-agent-backend-service `
    --task-definition ai-im-agent-backend `
    --desired-count 2 `
    --launch-type FARGATE `
    --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" `
    --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:996099991638:targetgroup/xxx/yyy,containerName=ai-im-agent-backend,containerPort=3001" `
    --region us-east-1
```

## Quick Deploy Script

Use the automated deployment script:

```powershell
.\deploy-aws.ps1 production us-east-1
```

This will:
1. Build application
2. Build Docker image
3. Push to ECR
4. Update ECS service

## AWS Console Links

- **ECR**: https://console.aws.amazon.com/ecr/repositories/private/996099991638/ai-im-agent-backend?region=us-east-1
- **ECS Cluster**: https://console.aws.amazon.com/ecs/v2/clusters/ai-im-agent-cluster?region=us-east-1
- **CloudFormation**: https://console.aws.amazon.com/cloudformation/home?region=us-east-1

## Environment Variables

Set these in your ECS task definition or use AWS Secrets Manager:

### Required
- `NODE_ENV=production`
- `PORT=3001`
- `JWT_SECRET` (32+ characters - use Secrets Manager)
- `FRONTEND_URL=https://aimed.ai`
- `API_URL=https://api.aimed.ai`

### Optional
- `OPENAI_API_KEY` (use Secrets Manager)
- `AWS_REGION=us-east-1`
- `TRANSCRIPTION_PROVIDER=aws-transcribe`

## Cost Estimate

### Development
- ECS Fargate: ~$15-20/month (1 task, 0.25 vCPU, 512 MB)
- ECR: ~$0.10/month (storage)
- ALB: ~$16/month
- **Total**: ~$30-40/month

### Production
- ECS Fargate: ~$60-80/month (2 tasks, 0.5 vCPU, 1024 MB)
- ECR: ~$0.10/month
- ALB: ~$16/month
- Data Transfer: Variable
- **Total**: ~$80-100/month

## Security Notes

⚠️ **Important**: 
- AWS credentials are configured locally
- Do NOT commit credentials to git
- Use IAM roles for ECS tasks
- Use AWS Secrets Manager for sensitive data
- Enable CloudTrail for audit logging

## Troubleshooting

### Check ECS Service Status
```powershell
aws ecs describe-services --cluster ai-im-agent-cluster --services ai-im-agent-backend-service --region us-east-1
```

### View Logs
```powershell
aws logs tail /ecs/ai-im-agent-backend --follow --region us-east-1
```

### Check Task Status
```powershell
aws ecs list-tasks --cluster ai-im-agent-cluster --region us-east-1
```

---

**Project Status**: ✅ **AWS Resources Created**

Ready to deploy your application!
