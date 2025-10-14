#!/bin/bash

# VaultPilot Deployment Script
# This script deploys the entire VaultPilot application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
AWS_REGION=${2:-us-east-1}
PROJECT_ROOT=$(pwd)

echo -e "${BLUE}🚀 Starting VaultPilot deployment...${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}AWS Region: ${AWS_REGION}${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    print_error "Terraform is not installed. Please install it first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install it first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install it first."
    exit 1
fi

print_status "All prerequisites are installed"

# Check AWS credentials
echo -e "${BLUE}🔐 Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

print_status "AWS credentials are configured"

# Deploy infrastructure
echo -e "${BLUE}🏗️  Deploying infrastructure...${NC}"
cd infrastructure

# Initialize Terraform
terraform init

# Plan deployment
echo -e "${BLUE}📋 Planning infrastructure deployment...${NC}"
terraform plan -var="environment=${ENVIRONMENT}" -var="aws_region=${AWS_REGION}"

# Apply infrastructure
echo -e "${BLUE}🚀 Deploying infrastructure...${NC}"
terraform apply -var="environment=${ENVIRONMENT}" -var="aws_region=${AWS_REGION}" -auto-approve

# Get outputs
API_GATEWAY_URL=$(terraform output -raw api_gateway_url)
FRONTEND_URL=$(terraform output -raw frontend_url)
COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
COGNITO_USER_POOL_CLIENT_ID=$(terraform output -raw cognito_user_pool_client_id)
DYNAMODB_TABLE=$(terraform output -raw dynamodb_table_name)

print_status "Infrastructure deployed successfully"

# Deploy backend
echo -e "${BLUE}🔧 Deploying backend services...${NC}"
cd ../backend

# Install dependencies
npm install

# Deploy Lambda functions
echo -e "${BLUE}📦 Deploying Lambda functions...${NC}"
npm run deploy

print_status "Backend services deployed successfully"

# Deploy frontend
echo -e "${BLUE}🎨 Deploying frontend...${NC}"
cd ../frontend

# Install dependencies
npm install

# Build frontend
echo -e "${BLUE}🔨 Building frontend...${NC}"
npm run build

# Deploy frontend
echo -e "${BLUE}🚀 Deploying frontend...${NC}"
npm run deploy

print_status "Frontend deployed successfully"

# Create environment file for local development
echo -e "${BLUE}📝 Creating environment configuration...${NC}"
cat > ../frontend/.env << EOF
REACT_APP_AWS_REGION=${AWS_REGION}
REACT_APP_USER_POOL_ID=${COGNITO_USER_POOL_ID}
REACT_APP_USER_POOL_CLIENT_ID=${COGNITO_USER_POOL_CLIENT_ID}
REACT_APP_API_ENDPOINT=${API_GATEWAY_URL}
EOF

print_status "Environment configuration created"

# Summary
echo ""
echo -e "${GREEN}🎉 VaultPilot deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Deployment Summary:${NC}"
echo -e "  Environment: ${ENVIRONMENT}"
echo -e "  AWS Region: ${AWS_REGION}"
echo -e "  API Gateway: ${API_GATEWAY_URL}"
echo -e "  Frontend URL: ${FRONTEND_URL}"
echo -e "  Cognito User Pool: ${COGNITO_USER_POOL_ID}"
echo ""
echo -e "${BLUE}🔗 Access your application:${NC}"
echo -e "  Frontend: ${FRONTEND_URL}"
echo -e "  API: ${API_GATEWAY_URL}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo -e "  1. Configure your first user in Cognito"
echo -e "  2. Set up credential integrations"
echo -e "  3. Configure notification settings"
echo -e "  4. Test credential discovery and rotation"
echo ""
echo -e "${GREEN}✨ VaultPilot is ready to use!${NC}"
