# VaultPilot Infrastructure
# Main Terraform configuration for VaultPilot deployment

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local values
locals {
  common_tags = {
    Project     = "VaultPilot"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# VPC and Networking
module "networking" {
  source = "./modules/networking"
  
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
  
  tags = local.common_tags
}

# DynamoDB Tables
module "database" {
  source = "./modules/database"
  
  environment = var.environment
  
  tags = local.common_tags
}

# Cognito User Pool
module "auth" {
  source = "./modules/auth"
  
  environment = var.environment
  
  tags = local.common_tags
}

# API Gateway
module "api" {
  source = "./modules/api"
  
  environment = var.environment
  
  tags = local.common_tags
}

# Lambda Functions
module "lambda" {
  source = "./modules/lambda"
  
  environment = var.environment
  
  tags = local.common_tags
}

# SNS Topics
module "notifications" {
  source = "./modules/notifications"
  
  environment = var.environment
  
  tags = local.common_tags
}

# S3 Bucket for Frontend
module "frontend" {
  source = "./modules/frontend"
  
  environment = var.environment
  
  tags = local.common_tags
}

# CloudWatch Logs
module "monitoring" {
  source = "./modules/monitoring"
  
  environment = var.environment
  
  tags = local.common_tags
}

# IAM Roles and Policies
module "iam" {
  source = "./modules/iam"
  
  environment = var.environment
  
  tags = local.common_tags
}
