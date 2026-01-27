# Lambda Function URL Webhook Setup

## Overview

This setup uses an AWS Lambda function with a Function URL to receive GitHub webhooks and trigger CodeBuild builds. This approach is simpler and more flexible than CodeBuild's native webhook feature.

## Architecture

```
GitHub Push Event
    ↓
GitHub Webhook
    ↓
Lambda Function URL
    ↓
Lambda Function (webhook-handler.py)
    ↓
CodeBuild Start Build
    ↓
Docker Build & Push to ECR
    ↓
ECS Service Update
```

## Quick Setup

### Step 1: Deploy Lambda Function

```powershell
cd C:\Users\ctrpr\Projects\aws\lambda
.\deploy-lambda-webhook.ps1
```

This will:
- ✅ Create Lambda function
- ✅ Create IAM role with CodeBuild permissions
- ✅ Create Function URL
- ✅ Configure environment variables
- ✅ Return webhook URL

### Step 2: Configure GitHub Webhook

1. **Go to GitHub Repository Settings:**
   - https://github.com/AI-Empower-360/ai-orchestrator/settings/hooks

2. **Click "Add webhook"**

3. **Configure webhook:**
   - **Payload URL**: Use the Function URL from Step 1
   - **Content type**: `application/json`
   - **Secret**: (Optional) Set a secret for HMAC verification
   - **Events**: Select "Just the push event"
   - **Active**: ✅ Checked

4. **Click "Add webhook"**

5. **Test webhook:**
   - GitHub will send a test event
   - Check Lambda logs to verify it received the event

### Step 3: Set GitHub Webhook Secret (Optional but Recommended)

For security, set a webhook secret:

1. **Generate a secret:**
   ```powershell
   # Generate random secret
   $secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
   Write-Host $secret
   ```

2. **Store in Secrets Manager:**
   ```powershell
   aws secretsmanager create-secret `
       --name github/webhook-secret `
       --secret-string $secret `
       --region us-east-1
   ```

3. **Update Lambda environment:**
   ```powershell
   $secret = aws secretsmanager get-secret-value --secret-id github/webhook-secret --region us-east-1 --query SecretString --output text
   
   aws lambda update-function-configuration `
       --function-name github-webhook-handler `
       --environment "Variables={GITHUB_WEBHOOK_SECRET=$secret,CODEBUILD_PROJECT=ai-im-agent-backend-build,AWS_REGION=us-east-1}" `
       --region us-east-1
   ```

4. **Add secret to GitHub webhook:**
   - Go to webhook settings
   - Paste the secret in "Secret" field
   - Save

## How It Works

### Lambda Function Flow

1. **Receive Webhook:**
   - GitHub sends POST request to Function URL
   - Lambda receives event with headers and body

2. **Verify Signature:**
   - Validates HMAC SHA256 signature (if secret is set)
   - Prevents unauthorized requests

3. **Process Event:**
   - Checks event type (only processes `push` events)
   - Validates branch (only triggers on `main` branch)

4. **Trigger CodeBuild:**
   - Calls `codebuild.start_build()`
   - Passes commit information as environment variables
   - Returns build ID

5. **Response:**
   - Returns 200 OK with build information
   - GitHub receives confirmation

### Security Features

- ✅ **HMAC Signature Verification**: Validates webhook authenticity
- ✅ **Branch Filtering**: Only triggers on `main` branch
- ✅ **Event Filtering**: Only processes `push` events
- ✅ **IAM Permissions**: Least privilege access
- ✅ **Function URL Auth**: Can be set to AWS_IAM for additional security

## Testing

### Test Webhook Manually

```powershell
# Get Function URL
$url = aws lambda get-function-url-config --function-name github-webhook-handler --region us-east-1 --query FunctionUrl --output text

# Test payload
$payload = @{
    ref = "refs/heads/main"
    head_commit = @{
        id = "abc123"
        message = "Test commit"
        author = @{
            name = "Test User"
        }
    }
} | ConvertTo-Json -Depth 10

# Send test request
Invoke-WebRequest -Uri $url -Method POST -Body $payload -ContentType "application/json"
```

### Monitor Lambda Execution

```powershell
# View recent invocations
aws logs tail /aws/lambda/github-webhook-handler --follow --region us-east-1

# Or in CloudWatch Console
# https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/%2Faws%2Flambda%2Fgithub-webhook-handler
```

### Test Full Flow

1. **Make a test commit:**
   ```bash
   echo "# Test" >> README.md
   git add README.md
   git commit -m "test: trigger webhook"
   git push origin main
   ```

2. **Check Lambda logs:**
   - Should see webhook received
   - Should see CodeBuild started

3. **Check CodeBuild:**
   - New build should appear
   - Build should complete successfully

## Troubleshooting

### Webhook Not Triggering

1. **Check Function URL:**
   ```powershell
   aws lambda get-function-url-config --function-name github-webhook-handler --region us-east-1
   ```

2. **Check GitHub webhook deliveries:**
   - Go to: https://github.com/AI-Empower-360/ai-orchestrator/settings/hooks
   - Click on webhook
   - Check "Recent Deliveries" for errors

3. **Check Lambda logs:**
   ```powershell
   aws logs tail /aws/lambda/github-webhook-handler --since 10m --region us-east-1
   ```

### Build Not Starting

1. **Check IAM permissions:**
   ```powershell
   aws iam get-role-policy --role-name lambda-github-webhook-role --policy-name CodeBuildStartBuildPolicy --region us-east-1
   ```

2. **Check CodeBuild project:**
   ```powershell
   aws codebuild batch-get-projects --names ai-im-agent-backend-build --region us-east-1
   ```

3. **Check Lambda environment variables:**
   ```powershell
   aws lambda get-function-configuration --function-name github-webhook-handler --region us-east-1 --query Environment
   ```

### Signature Verification Failing

1. **Check secret is set:**
   ```powershell
   aws lambda get-function-configuration --function-name github-webhook-handler --region us-east-1 --query 'Environment.Variables.GITHUB_WEBHOOK_SECRET'
   ```

2. **Verify secret matches GitHub:**
   - Lambda environment variable must match GitHub webhook secret
   - Both must be set or both must be empty

## Advanced Configuration

### Enable AWS_IAM Authentication

For additional security, require AWS IAM authentication:

```powershell
aws lambda update-function-url-config `
    --function-name github-webhook-handler `
    --auth-type AWS_IAM `
    --region us-east-1
```

Then configure GitHub to use AWS Signature Version 4 (requires additional setup).

### Add Custom Logic

Edit `webhook-handler.py` to add:
- Custom branch filtering
- Multiple CodeBuild projects
- Slack/email notifications
- Build status tracking

### Use Secrets Manager for Secret

Instead of environment variable, fetch from Secrets Manager:

```python
import boto3
secrets_client = boto3.client('secretsmanager')
secret = secrets_client.get_secret_value(SecretId='github/webhook-secret')['SecretString']
```

## Cost

- **Lambda**: Free tier includes 1M requests/month
- **Function URL**: No additional cost
- **Data Transfer**: Minimal (webhook payloads are small)

## Benefits Over CodeBuild Webhooks

- ✅ **More Control**: Custom logic and validation
- ✅ **Easier Setup**: No OAuth connection required
- ✅ **Better Logging**: CloudWatch logs for debugging
- ✅ **Flexible**: Can trigger multiple projects or services
- ✅ **Secure**: HMAC signature verification built-in

---

**Status**: Ready to deploy! Run `.\deploy-lambda-webhook.ps1` to get started.
