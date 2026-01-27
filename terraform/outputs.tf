output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.app.repository_url
}

output "codebuild_project_name" {
  description = "CodeBuild project name"
  value       = aws_codebuild_project.app.name
}

output "codepipeline_name" {
  description = "CodePipeline name"
  value       = var.github_connection_arn != "" ? aws_codepipeline.app[0].name : "Not created (GitHub connection required)"
}

output "codepipeline_url" {
  description = "CodePipeline console URL"
  value       = var.github_connection_arn != "" ? "https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${aws_codepipeline.app[0].name}/view?region=${var.aws_region}" : "N/A"
}

output "lambda_webhook_function_url" {
  description = "Lambda Function URL for GitHub webhook"
  value       = aws_lambda_function_url.webhook_handler.function_url
}

output "lambda_webhook_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.webhook_handler.function_name
}

output "github_webhook_configuration" {
  description = "GitHub webhook configuration"
  value = {
    url    = aws_lambda_function_url.webhook_handler.function_url
    secret = var.lambda_webhook_secret != "" ? "Set in GitHub webhook settings" : "Not configured"
  }
}
