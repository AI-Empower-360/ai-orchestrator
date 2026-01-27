# Terraform Infrastructure as Code

This directory contains Terraform configurations for deploying the AI IM Agent Backend infrastructure and CI/CD pipeline.

## Architecture

- **ECR**: Docker image repository
- **CodeBuild**: Build and push Docker images
- **CodePipeline**: CI/CD pipeline (optional, requires GitHub connection)
- **Lambda**: GitHub webhook handler
- **ECS**: Container orchestration (cluster and service)

## Prerequisites

1. **Terraform installed** (>= 1.0)
   ```bash
   terraform version
   ```

2. **AWS CLI configured**
   ```bash
   aws configure
   ```

3. **GitHub Connection** (for CodePipeline)
   - Create in AWS Console: https://console.aws.amazon.com/codesuite/settings/connections?region=us-east-1
   - Get the connection ARN

## Quick Start

### 1. Initialize Terraform

```powershell
cd C:\Users\ctrpr\Projects\terraform
terraform init
```

### 2. Configure Variables

Copy the example file and update:

```powershell
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` with your values:
- `github_connection_arn`: Get from AWS Console
- `lambda_webhook_secret`: Optional, for webhook security

### 3. Plan Deployment

```powershell
terraform plan
```

Review the changes that will be made.

### 4. Apply Configuration

```powershell
terraform apply
```

Type `yes` to confirm.

### 5. Get Outputs

After deployment, get important values:

```powershell
terraform output
```

Key outputs:
- `lambda_webhook_function_url`: Use this for GitHub webhook
- `ecr_repository_url`: Docker image repository
- `codepipeline_url`: Pipeline console URL

## What Gets Created

### Resources

1. **ECR Repository**
   - Docker image storage
   - Image scanning enabled
   - Lifecycle policy (keep last 10 images)

2. **CodeBuild Project**
   - Builds Docker images
   - Pushes to ECR
   - Creates `imagedefinitions.json`

3. **CodePipeline** (if GitHub connection provided)
   - Source: GitHub repository
   - Build: CodeBuild project
   - Deploy: ECS service

4. **Lambda Function**
   - GitHub webhook handler
   - Function URL for public access
   - Triggers CodeBuild on push

5. **IAM Roles & Policies**
   - CodeBuild execution role
   - CodePipeline execution role
   - Lambda execution role

6. **S3 Buckets**
   - CodeBuild artifacts
   - CodePipeline artifacts

7. **CloudWatch Log Groups**
   - CodeBuild logs
   - Lambda logs

## Configuration Options

### Without CodePipeline (Webhook Only)

If you don't provide `github_connection_arn`, only the webhook-based deployment will be created:
- CodeBuild project
- Lambda webhook handler
- ECR repository

### With CodePipeline (Full CI/CD)

Provide `github_connection_arn` to create the full pipeline:
- CodePipeline with 3 stages
- Automatic deployment on push

## GitHub Webhook Setup

After deployment, configure GitHub webhook:

1. **Get Function URL:**
   ```powershell
   terraform output lambda_webhook_function_url
   ```

2. **Configure in GitHub:**
   - Go to: https://github.com/AI-Empower-360/ai-orchestrator/settings/hooks/new
   - Payload URL: Use the Function URL from output
   - Content type: `application/json`
   - Events: Just the push event
   - Secret: (optional, set `lambda_webhook_secret` in tfvars)

## State Management

### Backend Configuration

Update `main.tf` backend configuration:

```hcl
backend "s3" {
  bucket = "your-terraform-state-bucket"
  key    = "ai-im-agent-backend/terraform.tfstate"
  region = "us-east-1"
}
```

### Local State (Default)

By default, state is stored locally in `terraform.tfstate`.

**Important**: Don't commit state files to git!

## Common Commands

```powershell
# Initialize
terraform init

# Plan changes
terraform plan

# Apply changes
terraform apply

# Show current state
terraform show

# List resources
terraform state list

# Get outputs
terraform output

# Destroy all resources
terraform destroy
```

## Updating Infrastructure

1. **Modify `.tf` files**
2. **Plan changes:**
   ```powershell
   terraform plan
   ```
3. **Apply:**
   ```powershell
   terraform apply
   ```

## Destroying Infrastructure

To remove all resources:

```powershell
terraform destroy
```

**Warning**: This will delete all resources created by Terraform!

## Troubleshooting

### Error: GitHub connection not found

**Solution**: Create GitHub connection in AWS Console first, then provide ARN in `terraform.tfvars`

### Error: ECR repository already exists

**Solution**: Either import existing resource or use different name:
```powershell
terraform import aws_ecr_repository.app ai-im-agent-backend
```

### Error: Lambda deployment package not found

**Solution**: Ensure `aws/lambda/webhook-handler.py` exists:
```powershell
# Create if missing
New-Item -ItemType File -Path ..\aws\lambda\webhook-handler.py -Force
```

## File Structure

```
terraform/
├── main.tf              # Provider and backend configuration
├── variables.tf         # Input variables
├── outputs.tf          # Output values
├── data.tf             # Data sources
├── ecr.tf              # ECR repository
├── codebuild.tf        # CodeBuild project
├── codepipeline.tf     # CodePipeline (optional)
├── lambda_webhook.tf   # Lambda webhook handler
├── terraform.tfvars.example  # Example variables
└── README.md           # This file
```

## Benefits of Terraform

✅ **Infrastructure as Code**: Version controlled  
✅ **Idempotent**: Safe to run multiple times  
✅ **State Management**: Tracks resource state  
✅ **Modular**: Easy to extend and modify  
✅ **Multi-Cloud**: Can be adapted for other clouds  
✅ **Plan Before Apply**: See changes before executing  

## Next Steps

1. Initialize Terraform: `terraform init`
2. Configure variables: Copy and edit `terraform.tfvars`
3. Plan deployment: `terraform plan`
4. Apply: `terraform apply`
5. Configure GitHub webhook with Function URL from outputs

---

**Ready to deploy!** 🚀
