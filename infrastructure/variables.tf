# VaultPilot Infrastructure Variables

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "SSL certificate ARN for HTTPS"
  type        = string
  default     = ""
}

variable "notification_email" {
  description = "Email address for notifications"
  type        = string
  default     = ""
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for notifications"
  type        = string
  default     = ""
  sensitive   = true
}

variable "github_token" {
  description = "GitHub token for integration"
  type        = string
  default     = ""
  sensitive   = true
}

variable "rotation_schedule" {
  description = "Schedule for automatic credential rotation"
  type        = string
  default     = "rate(1 day)"
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 30
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 14
}

variable "enable_monitoring" {
  description = "Enable detailed monitoring"
  type        = bool
  default     = true
}

variable "enable_notifications" {
  description = "Enable SNS notifications"
  type        = bool
  default     = true
}

variable "multi_region" {
  description = "Enable multi-region deployment"
  type        = bool
  default     = false
}

variable "additional_regions" {
  description = "Additional AWS regions for multi-region deployment"
  type        = list(string)
  default     = []
}
