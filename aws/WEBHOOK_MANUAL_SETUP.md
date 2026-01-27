# Manual GitHub Webhook Setup

## Current Status

✅ **GitHub Token Stored**: Secured in AWS Secrets Manager  
⚠️ **Webhook**: Needs to be created via AWS Console (one-time setup)

## Why Manual Setup?

CodeBuild webhooks require a GitHub OAuth connection to be established first. This is a one-time setup that's easiest done through the AWS Console.

## Step-by-Step Manual Setup

### Option 1: AWS Console (Recommended - 5 minutes)

1. **Go to CodeBuild Console:**
   - https://console.aws.amazon.com/codesuite/codebuild/projects/ai-im-agent-backend-build?region=us-east-1

2. **Click on "Webhooks" tab**

3. **Click "Create webhook"**

4. **Configure webhook:**
   - **Filter groups**: Click "Add filter group"
     - **Event**: Select "PUSH"
     - **Head ref**: Enter `^refs/heads/main$`
   - **Secret** (optional): Leave empty or create a secret for additional security

5. **Click "Create webhook"**

6. **Copy the webhook URL** (shown after creation)

7. **Verify in GitHub:**
   - Go to: https://github.com/AI-Empower-360/ai-orchestrator/settings/hooks
   - You should see the webhook listed (if GitHub connection is set up)

### Option 2: GitHub OAuth Connection (For Private Repos)

If your repository is private, you need to create a GitHub OAuth connection:

1. **Go to CodeBuild Settings:**
   - https://console.aws.amazon.com/codesuite/codebuild/home?region=us-east-1#/settings

2. **Click "Create connection"** under "Source connections"

3. **Select "GitHub"**

4. **Authorize AWS:**
   - Click "Connect to GitHub"
   - Authorize AWS CodeBuild in GitHub
   - Select the organization: `AI-Empower-360`

5. **Complete connection:**
   - Name: `github-connection`
   - Click "Connect"

6. **Update CodeBuild Project:**
   - Go to project settings
   - Edit source configuration
   - Select "GitHub (via CodeStar)"
   - Choose the connection you just created
   - Select repository: `ai-orchestrator`
   - Branch: `main`

7. **Then create webhook** (follow Option 1)

### Option 3: Use GitHub Personal Access Token

If you prefer using the token directly:

1. **Update CodeBuild project source:**
   ```powershell
   # Get token from Secrets Manager
   $token = aws secretsmanager get-secret-value --secret-id codebuild/github-token --region us-east-1 --query SecretString --output text
   
   # Update project (requires manual JSON edit)
   # Or use AWS Console to update source with token
   ```

2. **Create webhook** (follow Option 1)

## Verify Webhook is Working

### Test Automatic Build

1. **Make a test commit:**
   ```bash
   echo "# Test webhook" >> README.md
   git add README.md
   git commit -m "test: trigger CodeBuild webhook"
   git push origin main
   ```

2. **Check CodeBuild:**
   - Go to: https://console.aws.amazon.com/codesuite/codebuild/projects/ai-im-agent-backend-build/builds?region=us-east-1
   - A new build should start within 10-30 seconds

3. **Verify build:**
   - Build should be triggered automatically
   - No manual intervention needed

## Troubleshooting

### Webhook Not Triggering

1. **Check webhook status in CodeBuild:**
   - Go to project → Webhooks tab
   - Verify webhook is "Active"

2. **Check GitHub webhook deliveries:**
   - Go to: https://github.com/AI-Empower-360/ai-orchestrator/settings/hooks
   - Click on the webhook
   - Check "Recent Deliveries" tab
   - Look for any failed deliveries

3. **Verify branch name:**
   - Ensure you're pushing to `main` branch
   - Webhook filter: `^refs/heads/main$`

### Build Not Starting

1. **Check CodeBuild project source:**
   - Verify repository URL is correct
   - Verify branch exists

2. **Check IAM permissions:**
   - CodeBuild service role needs access to GitHub
   - For public repos, no special permissions needed

3. **Check buildspec.yml:**
   - Ensure `buildspec.yml` exists in repository root
   - Verify syntax is correct

## Alternative: Manual Build Trigger

If webhook setup is complex, you can trigger builds manually:

```powershell
# Trigger build on push
.\aws\start-codebuild.ps1

# Or via CLI
aws codebuild start-build --project-name ai-im-agent-backend-build --region us-east-1
```

## Quick Setup Checklist

- [ ] GitHub token stored in Secrets Manager ✅
- [ ] CodeBuild project created ✅
- [ ] Webhook created in AWS Console (manual step)
- [ ] Test push triggers build
- [ ] Verify automatic deployment works

---

**Note**: The webhook creation is a one-time manual step. Once set up, all future pushes to `main` will automatically trigger builds!
