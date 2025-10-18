# VaultPilot Quick Deployment Script
# This script deploys VaultPilot to AWS step by step

$ErrorActionPreference = "Continue"

Write-Host "🚀 Starting VaultPilot Deployment..." -ForegroundColor Blue
Write-Host ""

# Step 1: Create S3 Bucket for Frontend
Write-Host "📦 Step 1: Creating S3 bucket for frontend..." -ForegroundColor Cyan
$BUCKET_NAME = "vaultpilot-frontend-dev-$(Get-Random -Minimum 10000000 -Maximum 99999999)"
Write-Host "Bucket name: $BUCKET_NAME"

aws s3 mb s3://$BUCKET_NAME --region us-east-1
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html

# Make bucket public
$bucketPolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
        }
    ]
}
"@

$bucketPolicy | Out-File -FilePath bucket-policy.json -Encoding utf8
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy file://bucket-policy.json
Remove-Item bucket-policy.json

Write-Host "✅ S3 bucket created: $BUCKET_NAME" -ForegroundColor Green
Write-Host ""

# Step 2: Create additional DynamoDB table
Write-Host "📊 Step 2: Creating Settings DynamoDB table..." -ForegroundColor Cyan
aws dynamodb create-table `
    --table-name vaultpilot-settings-dev `
    --attribute-definitions AttributeName=id,AttributeType=S `
    --key-schema AttributeName=id,KeyType=HASH `
    --billing-mode PAY_PER_REQUEST `
    --region us-east-1

Write-Host "✅ Settings table created" -ForegroundColor Green
Write-Host ""

# Step 3: Create Cognito User Pool Client
Write-Host "🔐 Step 3: Creating Cognito User Pool Client..." -ForegroundColor Cyan
$USER_POOL_ID = "us-east-1_5HZ9uk8mM"
$clientResult = aws cognito-idp create-user-pool-client `
    --user-pool-id $USER_POOL_ID `
    --client-name vaultpilot-client-dev `
    --no-generate-secret `
    --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH `
    --region us-east-1 | ConvertFrom-Json

$CLIENT_ID = $clientResult.UserPoolClient.ClientId
Write-Host "✅ Cognito client created: $CLIENT_ID" -ForegroundColor Green
Write-Host ""

# Step 4: Create SNS Topic
Write-Host "📬 Step 4: Creating SNS topic for notifications..." -ForegroundColor Cyan
$snsResult = aws sns create-topic --name vaultpilot-notifications-dev --region us-east-1 | ConvertFrom-Json
$SNS_TOPIC_ARN = $snsResult.TopicArn
Write-Host "✅ SNS topic created: $SNS_TOPIC_ARN" -ForegroundColor Green
Write-Host ""

# Step 5: Create IAM Role for Lambda
Write-Host "👤 Step 5: Creating IAM role for Lambda..." -ForegroundColor Cyan

$assumeRolePolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
"@

$assumeRolePolicy | Out-File -FilePath assume-role-policy.json -Encoding utf8
aws iam create-role `
    --role-name vaultpilot-lambda-role-dev `
    --assume-role-policy-document file://assume-role-policy.json `
    --region us-east-1

# Attach basic execution policy
aws iam attach-role-policy `
    --role-name vaultpilot-lambda-role-dev `
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

Remove-Item assume-role-policy.json
Write-Host "✅ IAM role created" -ForegroundColor Green
Write-Host ""

# Step 6: Save outputs to file
Write-Host "💾 Step 6: Saving deployment outputs..." -ForegroundColor Cyan
$outputs = @"
# VaultPilot Deployment Outputs

## AWS Resources Created

### DynamoDB Tables
- vaultpilot-credentials-dev
- vaultpilot-audit-logs-dev
- vaultpilot-settings-dev

### Cognito
- User Pool ID: $USER_POOL_ID
- Client ID: $CLIENT_ID

### S3 Frontend
- Bucket: $BUCKET_NAME
- URL: http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com

### SNS
- Topic ARN: $SNS_TOPIC_ARN

### IAM
- Role: vaultpilot-lambda-role-dev

## Next Steps

1. Deploy Lambda functions:
   cd backend
   npm install
   npm run deploy

2. Build and deploy frontend:
   cd frontend
   npm install
   npm run build
   aws s3 sync build/ s3://$BUCKET_NAME --delete

3. Create first user:
   aws cognito-idp admin-create-user \
     --user-pool-id $USER_POOL_ID \
     --username admin \
     --user-attributes Name=email,Value=admin@yourcompany.com \
     --temporary-password TempPass123!

4. Access VaultPilot:
   http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com
"@

$outputs | Out-File -FilePath DEPLOYMENT_OUTPUTS.txt -Encoding utf8
Write-Host "✅ Outputs saved to DEPLOYMENT_OUTPUTS.txt" -ForegroundColor Green
Write-Host ""

# Display summary
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "🎉 VaultPilot Infrastructure Deployed Successfully!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Resources Created:" -ForegroundColor Cyan
Write-Host "  ✅ 3 DynamoDB Tables"
Write-Host "  ✅ Cognito User Pool + Client"
Write-Host "  ✅ S3 Frontend Bucket"
Write-Host "  ✅ SNS Topic"
Write-Host "  ✅ IAM Role"
Write-Host ""
Write-Host "🌐 Frontend URL:" -ForegroundColor Cyan
Write-Host "  http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 See DEPLOYMENT_OUTPUTS.txt for complete details" -ForegroundColor Cyan
Write-Host ""
