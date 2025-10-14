# VaultPilot Infrastructure Outputs

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = module.api.api_gateway_url
}

output "frontend_url" {
  description = "Frontend application URL"
  value       = module.frontend.cloudfront_url
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = module.auth.user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = module.auth.user_pool_client_id
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = module.database.table_name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for notifications"
  value       = module.notifications.topic_arn
}

output "lambda_functions" {
  description = "Lambda function ARNs"
  value = {
    discovery = module.lambda.discovery_function_arn
    rotation  = module.lambda.rotation_function_arn
    audit     = module.lambda.audit_function_arn
    notifier  = module.lambda.notifier_function_arn
  }
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = module.monitoring.dashboard_url
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.networking.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.networking.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.networking.public_subnet_ids
}

output "security_group_id" {
  description = "Security group ID"
  value       = module.networking.security_group_id
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = module.iam.kms_key_id
}

output "iam_role_arn" {
  description = "IAM role ARN for Lambda functions"
  value       = module.iam.lambda_role_arn
}
