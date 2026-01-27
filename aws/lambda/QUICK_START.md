# Quick Start: Lambda Webhook Deployment

## Option 1: Deploy via AWS Console (Recommended - No CLI Issues)

### Step 1: Deploy CloudFormation Stack

1. **Go to CloudFormation Console:**
   - https://console.aws.amazon.com/cloudformation/home?region=us-east-1#/stacks/create/template

2. **Upload Template:**
   - Select "Upload a template file"
   - Upload: `aws/lambda/lambda-webhook-template.yaml`
   - Click "Next"

3. **Specify Stack Details:**
   - Stack name: `lambda-github-webhook`
   - CodeBuildProject: `ai-im-agent-backend-build`
   - GitHubWebhookSecret: (leave empty for now, or set a secret)
   - Click "Next"

4. **Configure Stack Options:**
   - Click "Next"

5. **Review:**
   - Check "I acknowledge that AWS CloudFormation might create IAM resources"
   - Click "Create stack"

6. **Wait for completion:**
   - Stack will create Lambda function, IAM role, and Function URL
   - Takes ~2-3 minutes

7. **Get Function URL:**
   - Go to "Outputs" tab
   - Copy the `FunctionURL` value

### Step 2: Configure GitHub Webhook

1. **Go to GitHub:**
   - https://github.com/AI-Empower-360/ai-orchestrator/settings/hooks

2. **Click "Add webhook"**

3. **Configure:**
   - **Payload URL**: Paste the Function URL from Step 1
   - **Content type**: `application/json`
   - **Secret**: (optional, but recommended)
     - Generate: `openssl rand -hex 20`
     - Store in AWS Secrets Manager
     - Update Lambda environment variable
   - **Events**: Select "Just the push event"
   - **Active**: ✅ Checked

4. **Click "Add webhook"**

5. **Test:**
   - GitHub will send a test event
   - Check Lambda logs to verify

### Step 3: Test

```bash
# Make a test commit
echo "# Test" >> README.md
git add README.md
git commit -m "test: trigger webhook"
git push origin main
```

Check CodeBuild console - a new build should start automatically!

## Option 2: Deploy via AWS CLI (If Working)

```powershell
cd C:\Users\ctrpr\Projects\aws\lambda
.\deploy-cloudformation.ps1
```

## Option 3: Manual Lambda Creation

If CloudFormation doesn't work:

1. **Create IAM Role:**
   - Use `trust-policy.json` and `codebuild-policy.json`

2. **Create Lambda Function:**
   - Upload `lambda-webhook-handler.zip`
   - Runtime: Python 3.11
   - Handler: `lambda_function.lambda_handler`
   - Environment: `CODEBUILD_PROJECT=ai-im-agent-backend-build`

3. **Create Function URL:**
   - Auth type: NONE
   - CORS: Enable for all origins

## Files Created

- ✅ `lambda-webhook-template.yaml` - CloudFormation template
- ✅ `webhook-handler.py` - Lambda function code
- ✅ `lambda-webhook-handler.zip` - Deployment package
- ✅ `deploy-cloudformation.ps1` - Deployment script
- ✅ `LAMBDA_WEBHOOK_SETUP.md` - Complete documentation

## Next Steps

1. Deploy CloudFormation stack (Option 1 above)
2. Get Function URL from stack outputs
3. Configure GitHub webhook with Function URL
4. Test by pushing to main branch
5. Verify CodeBuild starts automatically

---

**Status**: All files ready! Deploy via AWS Console for easiest setup.
