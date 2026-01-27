# GitHub Webhook Setup for CodeBuild

## ✅ Configuration Complete

### GitHub Token Stored
- **Location**: AWS Secrets Manager
- **Secret Name**: `codebuild/github-token`
- **Region**: us-east-1
- **Status**: ✅ Secured

### Webhook Configuration
- **Project**: `ai-im-agent-backend-build`
- **Repository**: `AI-Empower-360/ai-orchestrator`
- **Branch**: `main`
- **Trigger**: Automatic builds on push to `main` branch

## 🚀 How It Works

### Automatic Builds

1. **You push code to GitHub:**
   ```bash
   git push origin main
   ```

2. **GitHub sends webhook to CodeBuild:**
   - CodeBuild receives push notification
   - Validates it's from the `main` branch
   - Starts a new build automatically

3. **CodeBuild processes:**
   - Clones repository
   - Runs buildspec.yml
   - Builds Docker image
   - Pushes to ECR
   - Updates ECS service

4. **Result:**
   - New version deployed automatically!

## 📋 Manual Webhook Setup (Alternative)

If the script didn't work, set up manually:

### Step 1: Create Webhook in AWS Console

1. Go to CodeBuild Console
2. Select project: `ai-im-agent-backend-build`
3. Go to "Webhooks" tab
4. Click "Create webhook"
5. Configure:
   - **Filter groups**: 
     - Event: `PUSH`
     - Head ref: `^refs/heads/main$`
   - **Secret**: (optional, for security)

### Step 2: Verify Webhook

After creating, GitHub will show the webhook in:
- Repository Settings → Webhooks
- URL: `https://codebuild.us-east-1.amazonaws.com/webhooks/v2/...`

## 🔒 Security

### Token Storage
- ✅ Token stored in AWS Secrets Manager
- ✅ Encrypted at rest
- ✅ Access controlled via IAM

### Webhook Security
- Webhook URL is unique and secret
- Only responds to valid GitHub events
- Validates branch and event type

## 🧪 Testing

### Test Automatic Build

1. **Make a small change:**
   ```bash
   echo "# Test" >> README.md
   git add README.md
   git commit -m "test: trigger CodeBuild"
   git push origin main
   ```

2. **Monitor build:**
   - AWS Console: https://console.aws.amazon.com/codesuite/codebuild/projects/ai-im-agent-backend-build/builds?region=us-east-1
   - Build should start within seconds

3. **Verify:**
   - Check build status
   - Verify Docker image in ECR
   - Check ECS service update (if configured)

## 🔧 Troubleshooting

### Webhook Not Triggering

1. **Check webhook status:**
   ```powershell
   aws codebuild list-webhooks --project-name ai-im-agent-backend-build --region us-east-1
   ```

2. **Verify GitHub repository:**
   - Ensure repository is accessible
   - Check branch name matches (`main`)

3. **Check webhook in GitHub:**
   - Go to: https://github.com/AI-Empower-360/ai-orchestrator/settings/hooks
   - Verify webhook is listed and active

### Build Not Starting

1. **Check filter groups:**
   - Ensure branch pattern matches: `^refs/heads/main$`
   - Verify event type is `PUSH`

2. **Check CodeBuild project:**
   ```powershell
   aws codebuild batch-get-projects --names ai-im-agent-backend-build --region us-east-1
   ```

3. **View webhook logs:**
   - Check GitHub webhook delivery logs
   - Check CodeBuild webhook events

## 📊 Monitoring

### View Recent Builds
```powershell
aws codebuild list-builds-for-project --project-name ai-im-agent-backend-build --region us-east-1
```

### View Build Status
```powershell
aws codebuild batch-get-builds --ids <build-id> --region us-east-1
```

### View Logs
```powershell
aws logs tail /aws/codebuild/ai-im-agent-backend-build --follow --region us-east-1
```

## 🎯 Workflow

### Development Workflow

1. **Develop locally:**
   ```bash
   # Make changes
   git add .
   git commit -m "feat: new feature"
   ```

2. **Push to GitHub:**
   ```bash
   git push origin main
   ```

3. **Automatic deployment:**
   - CodeBuild starts automatically
   - Builds and pushes Docker image
   - Updates ECS service
   - New version live!

### Branch Strategy

- **main branch**: Automatic builds and deployment
- **feature branches**: Manual builds (or configure separate webhook)
- **tags**: Can trigger production deployments

## ✨ Benefits

- ✅ **Zero Manual Steps**: Push code, get deployment
- ✅ **Fast Feedback**: Builds start within seconds
- ✅ **Consistent**: Same build process every time
- ✅ **Secure**: Token stored in Secrets Manager
- ✅ **Scalable**: Handles any repository size

---

**Status**: ✅ **GitHub Webhook Configured**

Your CodeBuild project will now automatically build and deploy whenever you push code to the `main` branch!
