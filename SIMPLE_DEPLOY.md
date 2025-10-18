# VaultPilot - Simple Deployment Guide

## 🎯 Quick Deploy (Copy-Paste These Commands)

### **Step 1: Create S3 Bucket for Frontend**
```powershell
# Generate random bucket name
$BUCKET = "vaultpilot-frontend-dev-$(Get-Random -Minimum 10000000 -Maximum 99999999)"
Write-Host "Bucket name: $BUCKET"

# Create bucket
aws s3 mb s3://$BUCKET

# Enable website hosting
aws s3 website s3://$BUCKET --index-document index.html

# Save bucket name for later
$BUCKET | Out-File -FilePath bucket-name.txt
```

### **Step 2: Make Bucket Public**
```powershell
# Create policy file
@"
{
    "Version": "2012-10-17",
    "Statement": [{
        "Sid": "PublicRead",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::$BUCKET/*"
    }]
}
"@ | Out-File policy.json -Encoding utf8

# Apply policy
aws s3api put-bucket-policy --bucket $BUCKET --policy file://policy.json
aws s3api delete-public-access-block --bucket $BUCKET

# Cleanup
Remove-Item policy.json
```

### **Step 3: Create Settings Table**
```powershell
aws dynamodb create-table `
  --table-name vaultpilot-settings-dev `
  --attribute-definitions AttributeName=id,AttributeType=S `
  --key-schema AttributeName=id,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST
```

### **Step 4: Create Cognito Client**
```powershell
$result = aws cognito-idp create-user-pool-client `
  --user-pool-id us-east-1_5HZ9uk8mM `
  --client-name vaultpilot-client-dev `
  --no-generate-secret `
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH | ConvertFrom-Json

$CLIENT_ID = $result.UserPoolClient.ClientId
Write-Host "Client ID: $CLIENT_ID"
$CLIENT_ID | Out-File -FilePath client-id.txt
```

### **Step 5: Create SNS Topic**
```powershell
$sns = aws sns create-topic --name vaultpilot-notifications-dev | ConvertFrom-Json
$SNS_TOPIC = $sns.TopicArn
Write-Host "SNS Topic: $SNS_TOPIC"
```

### **Step 6: Build and Deploy Frontend**
```powershell
# Go to frontend
cd frontend

# Install and build
npm install
npm run build

# Read bucket name
$BUCKET = Get-Content ..\bucket-name.txt

# Deploy to S3
aws s3 sync build/ s3://$BUCKET --delete

# Get website URL
$URL = "http://$BUCKET.s3-website-us-east-1.amazonaws.com"
Write-Host "Website URL: $URL" -ForegroundColor Green
$URL | Out-File -FilePath ..\website-url.txt
```

### **Step 7: Create First User**
```powershell
# Create admin user
aws cognito-idp admin-create-user `
  --user-pool-id us-east-1_5HZ9uk8mM `
  --username admin `
  --user-attributes Name=email,Value=admin@yourcompany.com `
  --temporary-password TempPass123!
```

## 🎉 **Done! Access Your App**

```powershell
# Show the URL
Get-Content website-url.txt
```

Open that URL in your browser and login with:
- **Username**: `admin`
- **Password**: `TempPass123!` (you'll be asked to change it)

---

## 📊 **What You'll Have**

✅ **3 DynamoDB Tables**:
- vaultpilot-credentials-dev
- vaultpilot-audit-logs-dev  
- vaultpilot-settings-dev

✅ **Cognito Authentication**:
- User Pool: us-east-1_5HZ9uk8mM
- Client ID: (saved in client-id.txt)

✅ **Frontend Website**:
- S3 bucket with static website
- React dashboard live

✅ **SNS Notifications**: Ready for alerts

---

## ⏰ **Time Required**
- 10-15 minutes total
- Just copy-paste commands one by one

---

## 🔧 **If Something Fails**

### Bucket already exists?
```powershell
# Use a different random number
$BUCKET = "vaultpilot-frontend-dev-$(Get-Random -Minimum 10000000 -Maximum 99999999)"
```

### Table already exists?
```powershell
# Skip that step, it's already created!
```

### Permission error?
```powershell
# Check your AWS credentials
aws sts get-caller-identity
```

---

## 🚀 **Next Steps (Optional)**

After the frontend is working:

1. **Deploy Lambda Functions** (for actual rotation):
```powershell
cd backend
npm install
# Need Serverless Framework: npm install -g serverless
# Then: npm run deploy
```

2. **Add Your Email for Notifications**:
```powershell
aws sns subscribe --topic-arn $SNS_TOPIC --protocol email --notification-endpoint your@email.com
```

---

## 📝 **Summary**

**Current Status**: 
- ✅ 2 DynamoDB tables (credentials, audit-logs)
- ✅ Cognito User Pool

**After This Guide**:
- ✅ All 3 DynamoDB tables
- ✅ Cognito + Client
- ✅ Frontend website LIVE
- ✅ SNS notifications
- ✅ First admin user created

**Total Time**: 10-15 minutes
**Cost**: ~$15-30/month

Ready to access VaultPilot! 🎯
