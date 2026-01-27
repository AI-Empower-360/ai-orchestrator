terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Using local backend for now
  # Uncomment and configure S3 backend for production use:
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "ai-im-agent-backend/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "AI-IM-Agent-Backend"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  }
}
