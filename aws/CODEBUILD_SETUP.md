# AWS CodeBuild Setup - AI IM Agent Backend

## Overview

AWS CodeBuild automatically builds your Docker image and pushes it to ECR whenever you push code to GitHub. No local Docker installation required!

## Prerequisites

✅ AWS CLI configured with credentials  
✅ ECR repository created (`ai-im-agent-backend`)  
✅ GitHub repository accessible  

## Quick Setup

### Step 1: Create CodeBuild Project

```powershell
.\aws\create-codebuild-project.ps1
```

This creates:
- CodeBuild project: `ai-im-agent-backend-build`
- IAM service role with ECR and ECS permissions
- CloudWatch Log Group for build logs
- Configuration for automatic Docker builds

### Step 2: Start Your First Build

```powershell
.\aws\start-codebuild.ps1
```

Or manually:
```powershell
aws codebuild start-build --project-name ai-im-agent-backend-build --region us-east-1
```

### Step 3: Monitor Build

**Console:**
https://console.aws.amazon.com/codesuite/codebuild/projects/ai-im-agent-backend-build/builds?region=us-east-1

**CLI:**
```powershell
aws codebuild list-builds-for-project --project-name ai-im-agent-backend-build --region us-east-1
```

## Automatic Builds on Git Push

### Option 1: GitHub Webhook (Recommended)

1. **Create GitHub Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Generate token with permissions:
     - `repo` (Full control of private repositories)
     - `admin:repo_hook` (Full control of repository hooks)

2. **Store token in AWS Secrets Manager:**
   ```powershell
   aws secretsmanager create-secret `
       --name codebuild/github-token `
       --secret-string "your-github-token" `
       --region us-east-1
   ```

3. **Create Webhook:**
   ```powershell
   aws codebuild create-webhook `
       --project-name ai-im-agent-backend-build `
       --filter-groups '[[{"type":"EVENT","pattern":"PUSH"},{"type":"HEAD_REF","pattern":"^refs/heads/main$"}]]' `
       --region us-east-1
   ```

### Option 2: GitHub Actions (Alternative)

Create `.github/workflows/codebuild.yml`:

```yaml
name: Trigger CodeBuild

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger CodeBuild
        uses: aws-actions/aws-codebuild-run-build@v1
        with:
          project-name: ai-im-agent-backend-build
          region: us-east-1
```

## Build Process

The `buildspec.yml` file defines the build process:

1. **Pre-build:**
   - Login to ECR
   - Run pre-build validation (`npm run validate`)

2. **Build:**
   - Install dependencies (`npm ci`)
   - Build application (`npm run build`)
   - Build Docker image
   - Tag image with `production` and `latest`

3. **Post-build:**
   - Push image to ECR
   - Update ECS service (if `UPDATE_ECS_SERVICE=true`)

## Environment Variables

Configured in CodeBuild project:
- `AWS_DEFAULT_REGION`: us-east-1
- `AWS_ACCOUNT_ID`: 996099991638
- `IMAGE_REPO_NAME`: ai-im-agent-backend
- `IMAGE_TAG`: production
- `UPDATE_ECS_SERVICE`: true (auto-updates ECS after build)

## Customizing Builds

### Change Build Environment

Edit `create-codebuild-project.ps1`:
```powershell
computeType = "BUILD_GENERAL1_LARGE"  # For faster builds
```

### Add Environment Variables

Edit `buildspec.yml`:
```yaml
env:
  variables:
    CUSTOM_VAR: "value"
  parameter-store:
    SECRET_VAR: /ai-im-agent-backend/secret
```

### Build Specific Branch

```powershell
.\aws\start-codebuild.ps1 -Branch feature/new-feature
```

## Troubleshooting

### Build Fails: ECR Login

**Error:** `Unable to locate credentials`

**Fix:** Ensure CodeBuild service role has ECR permissions:
```powershell
aws iam get-role-policy --role-name codebuild-ai-im-agent-service-role --policy-name CodeBuildECRPolicy --region us-east-1
```

### Build Fails: Docker Build

**Error:** `Cannot connect to Docker daemon`

**Fix:** Ensure `privilegedMode = true` in CodeBuild project configuration.

### Build Succeeds but ECS Not Updated

**Error:** ECS service update skipped

**Fix:** 
1. Ensure ECS service exists: `aws ecs describe-services --cluster ai-im-agent-cluster --services ai-im-agent-backend-service --region us-east-1`
2. Check IAM permissions for ECS update
3. Verify `UPDATE_ECS_SERVICE=true` in environment variables

### View Build Logs

```powershell
# Get latest build
$buildId = aws codebuild list-builds-for-project --project-name ai-im-agent-backend-build --region us-east-1 --query 'ids[0]' --output text

# Get logs
aws logs tail /aws/codebuild/ai-im-agent-backend-build --follow --region us-east-1
```

## Integration with ECS Deployment

After CodeBuild pushes the image:

1. **Automatic (if enabled):**
   - CodeBuild updates ECS service automatically
   - New tasks start with new image

2. **Manual:**
   ```powershell
   aws ecs update-service `
       --cluster ai-im-agent-cluster `
       --service ai-im-agent-backend-service `
       --force-new-deployment `
       --region us-east-1
   ```

## Cost Optimization

- **Use Fargate Spot:** Configure ECS to use Fargate Spot for cost savings
- **Build Timeout:** Set timeout in CodeBuild project (default: 60 minutes)
- **Build Frequency:** Only build on main branch or tags to reduce costs

## Next Steps

1. ✅ Create CodeBuild project
2. ✅ Run first build
3. ✅ Set up GitHub webhook for automatic builds
4. ✅ Create ECS service (if not exists)
5. ✅ Verify deployment

---

**Status**: Ready to build and deploy automatically! 🚀
