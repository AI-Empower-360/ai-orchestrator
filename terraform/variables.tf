variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "ai-im-agent-backend"
}

variable "github_owner" {
  description = "GitHub organization or username"
  type        = string
  default     = "AI-Empower-360"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "ai-orchestrator"
}

variable "github_branch" {
  description = "GitHub branch to monitor"
  type        = string
  default     = "main"
}

variable "github_connection_arn" {
  description = "ARN of GitHub CodeStar connection (create in Console first)"
  type        = string
  default     = ""
}

variable "ecr_repository_name" {
  description = "ECR repository name"
  type        = string
  default     = "ai-im-agent-backend"
}

variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
  default     = "ai-im-agent-cluster"
}

variable "ecs_service_name" {
  description = "ECS service name"
  type        = string
  default     = "ai-im-agent-backend-service"
}

variable "lambda_webhook_secret" {
  description = "GitHub webhook secret for Lambda (optional)"
  type        = string
  default     = ""
  sensitive   = true
}
