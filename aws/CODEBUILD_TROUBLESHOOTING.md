# CodeBuild Troubleshooting Guide

## Common Issues and Solutions

### Build Failed: Source Checkout

**Symptoms:**
- Build fails in PRE_BUILD or SOURCE phase
- Error: "Unable to clone repository"

**Solutions:**

1. **Check GitHub Repository Access:**
   - Ensure repository is accessible: https://github.com/AI-Empower-360/ai-orchestrator
   - Verify branch exists: `main`

2. **For Private Repositories:**
   - Create GitHub OAuth connection in CodeBuild
   - Or use GitHub Personal Access Token

3. **Update Source Configuration:**
   ```powershell
   aws codebuild update-project `
       --name ai-im-agent-backend-build `
       --source type=GITHUB,location=https://github.com/AI-Empower-360/ai-orchestrator.git `
       --region us-east-1
   ```

### Build Failed: npm install

**Symptoms:**
- Build fails in BUILD phase
- Error: "npm ci failed"

**Solutions:**

1. **Check package.json exists:**
   - Verify `package.json` is in repository root

2. **Check Node.js version:**
   - CodeBuild standard:7.0 uses Node.js 18
   - Verify compatibility with your package.json

3. **Add buildspec override:**
   ```yaml
   build:
     commands:
       - node --version
       - npm --version
       - npm ci --verbose
   ```

### Build Failed: Docker Build

**Symptoms:**
- Build fails during Docker build
- Error: "Cannot connect to Docker daemon"

**Solutions:**

1. **Verify privilegedMode:**
   - Must be `true` in CodeBuild project
   - Check: `aws codebuild batch-get-project --names ai-im-agent-backend-build --region us-east-1`

2. **Check Dockerfile:**
   - Ensure Dockerfile exists in repository root
   - Verify Dockerfile syntax

### Build Failed: ECR Push

**Symptoms:**
- Build fails in POST_BUILD phase
- Error: "unauthorized: authentication required"

**Solutions:**

1. **Verify IAM Permissions:**
   ```powershell
   aws iam get-role-policy `
       --role-name codebuild-ai-im-agent-service-role `
       --policy-name CodeBuildECRPolicy `
       --region us-east-1
   ```

2. **Check ECR Repository:**
   ```powershell
   aws ecr describe-repositories --repository-names ai-im-agent-backend --region us-east-1
   ```

### View Build Logs

**AWS Console:**
1. Go to CodeBuild console
2. Select project: `ai-im-agent-backend-build`
3. Click on failed build
4. View logs in CloudWatch

**CLI:**
```powershell
# Get build ID
$buildId = aws codebuild list-builds-for-project --project-name ai-im-agent-backend-build --region us-east-1 --query 'ids[0]' --output text

# Get build details
aws codebuild batch-get-builds --ids $buildId --region us-east-1

# View CloudWatch logs
aws logs get-log-events `
    --log-group-name /aws/codebuild/ai-im-agent-backend-build `
    --log-stream-name <stream-name> `
    --region us-east-1
```

## Quick Fixes

### Re-run Build
```powershell
.\aws\start-codebuild.ps1
```

### Update Project Configuration
```powershell
aws codebuild update-project --cli-input-json file://aws/codebuild-project.json --region us-east-1
```

### Check Project Status
```powershell
aws codebuild batch-get-projects --names ai-im-agent-backend-build --region us-east-1
```

## Next Steps After Fix

1. **Fix the issue** (see solutions above)
2. **Re-run build**: `.\aws\start-codebuild.ps1`
3. **Monitor**: Check AWS Console for progress
4. **Verify**: Check ECR for pushed image

---

**Note**: The first build may fail due to initial setup. Check logs to identify the specific issue and apply the appropriate fix.
