# IAM Role for Lambda
resource "aws_iam_role" "lambda_webhook" {
  name = "${var.project_name}-lambda-webhook-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_webhook" {
  role = aws_iam_role.lambda_webhook.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/${var.project_name}-webhook-handler"
      },
      {
        Effect = "Allow"
        Action = [
          "codebuild:StartBuild",
          "codebuild:BatchGetBuilds"
        ]
        Resource = aws_codebuild_project.app.arn
      }
    ]
  })
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_webhook" {
  name              = "/aws/lambda/${var.project_name}-webhook-handler"
  retention_in_days = 7
}

# Lambda deployment package
data "archive_file" "lambda_webhook" {
  type        = "zip"
  source_file = "${path.module}/../aws/lambda/webhook-handler.py"
  output_path = "${path.module}/lambda-webhook-handler.zip"
}

# Lambda Function
resource "aws_lambda_function" "webhook_handler" {
  filename         = data.archive_file.lambda_webhook.output_path
  function_name    = "${var.project_name}-webhook-handler"
  role             = aws_iam_role.lambda_webhook.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_webhook.output_base64sha256
  runtime          = "python3.11"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      CODEBUILD_PROJECT = aws_codebuild_project.app.name
      AWS_REGION       = var.aws_region
      GITHUB_WEBHOOK_SECRET = var.lambda_webhook_secret
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.lambda_webhook,
    aws_iam_role_policy.lambda_webhook
  ]
}

# Lambda Function URL
resource "aws_lambda_function_url" "webhook_handler" {
  function_name      = aws_lambda_function.webhook_handler.function_name
  authorization_type = "NONE"

  cors {
    allow_origins = ["*"]
    allow_methods = ["POST"]
    allow_headers = ["*"]
  }
}

# Lambda Permission for Function URL
resource "aws_lambda_permission" "webhook_handler_url" {
  statement_id  = "FunctionURLAllowPublicAccess"
  action        = "lambda:InvokeFunctionUrl"
  function_name = aws_lambda_function.webhook_handler.function_name
  principal     = "*"

  function_url_auth_type = "NONE"
}
