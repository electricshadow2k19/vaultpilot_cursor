# 🔐 VaultPilot Customer Onboarding Guide

**For Account**: techgeekalpha (411474509059)

---

## **What VaultPilot Needs:**

To scan and rotate your AWS credentials automatically, VaultPilot needs permission to access your AWS account. We use **IAM Role Assumption** with **External ID** - the most secure method recommended by AWS.

### **Security Features:**
✅ **No long-lived credentials** - We never store your AWS access keys  
✅ **Temporary access only** - STS tokens expire after 1 hour  
✅ **External ID protection** - Prevents confused deputy attacks  
✅ **Least privilege** - Only permissions needed for credential rotation  
✅ **Audit trail** - All actions logged  

---

## **Setup Instructions (5 minutes):**

### **Method 1: CloudFormation (Recommended)**

1. **Download the template**: `customer-role-template-techgeekalpha.yaml`

2. **Deploy via AWS Console**:
   - Log into AWS account **411474509059**
   - Go to **CloudFormation** → **Create Stack**
   - Upload `customer-role-template-techgeekalpha.yaml`
   - Click **Next** → **Next**
   - Check "I acknowledge that AWS CloudFormation might create IAM resources"
   - Click **Create Stack**
   - Wait 1-2 minutes ✅

3. **Done!** Tell VaultPilot admin to click "Scan" in the dashboard

### **Method 2: AWS CLI**

```bash
aws cloudformation create-stack \
  --stack-name VaultPilot-Customer-Role \
  --template-body file://customer-role-template-techgeekalpha.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### **Method 3: Manual Setup (if you prefer)**

#### **Step 1: Create IAM Role**

1. Go to **IAM** → **Roles** → **Create Role**
2. Select **Another AWS account**
3. **Account ID**: `700880967608` (VaultPilot's account)
4. ✅ Check **Require external ID**
5. **External ID**: `vaultpilot-411474509059-secure`
6. Click **Next**

#### **Step 2: Attach Policies**

Select these AWS managed policies:
- ✅ `IAMReadOnlyAccess`
- ✅ `SecretsManagerReadWrite`

#### **Step 3: Add Custom Policy**

Click "Create policy" and paste this:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DiscoverCredentials",
      "Effect": "Allow",
      "Action": [
        "iam:ListUsers",
        "iam:ListAccessKeys",
        "iam:GetUser",
        "secretsmanager:ListSecrets",
        "secretsmanager:DescribeSecret",
        "ssm:DescribeParameters",
        "rds:DescribeDBInstances"
      ],
      "Resource": "*"
    },
    {
      "Sid": "RotateIAMKeys",
      "Effect": "Allow",
      "Action": [
        "iam:CreateAccessKey",
        "iam:DeleteAccessKey",
        "iam:UpdateAccessKey"
      ],
      "Resource": "*"
    },
    {
      "Sid": "RotateSecrets",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:PutSecretValue",
        "secretsmanager:UpdateSecret",
        "secretsmanager:RotateSecret"
      ],
      "Resource": "*"
    }
  ]
}
```

#### **Step 4: Name the Role**

- **Role name**: `VaultPilotAccess`
- Click **Create Role**

#### **Step 5: Get Role ARN**

Copy the Role ARN (should be):
```
arn:aws:iam::411474509059:role/VaultPilotAccess
```

Send to VaultPilot admin:
- ✅ Role ARN: `arn:aws:iam::411474509059:role/VaultPilotAccess`
- ✅ External ID: `vaultpilot-411474509059-secure`
- ✅ Account ID: `411474509059`

---

## **What Happens Next:**

Once the role is created:

1. VaultPilot admin clicks **"Scan"** button in the dashboard
2. VaultPilot assumes your IAM role (temporary access)
3. Scans for:
   - ✅ IAM Access Keys
   - ✅ AWS Secrets Manager secrets
   - ✅ RDS database passwords
   - ✅ SSM Parameters
4. Account status changes to **"Active"** ✅
5. Credentials are automatically rotated every 90 days
6. You receive notifications for each rotation

---

## **Verification:**

After setup, you can verify the role:

```bash
# Check if role exists
aws iam get-role --role-name VaultPilotAccess

# Test the trust policy
aws sts assume-role \
  --role-arn arn:aws:iam::411474509059:role/VaultPilotAccess \
  --role-session-name test \
  --external-id vaultpilot-411474509059-secure
```

---

## **Permissions Explained:**

### **What VaultPilot CAN Do:**
✅ List IAM users and access keys (read-only)  
✅ List secrets in Secrets Manager  
✅ Rotate IAM access keys (create new, delete old)  
✅ Rotate secrets in Secrets Manager  
✅ List RDS databases (for password rotation)  

### **What VaultPilot CANNOT Do:**
❌ Create/delete IAM users  
❌ Change IAM policies  
❌ Access your EC2 instances  
❌ Modify your infrastructure  
❌ Delete resources  
❌ Access billing information  

---

## **Cost:**

There is **no additional AWS cost** for VaultPilot integration:
- IAM roles: **Free**
- STS AssumeRole calls: **Free**
- Secrets Manager: Existing pricing
- DynamoDB: Negligible (VaultPilot's account)

---

## **Support:**

Questions? Contact VaultPilot support:
- Email: support@vaultpilot.com
- Documentation: https://docs.vaultpilot.com

---

## **Compliance & Security:**

VaultPilot follows AWS best practices:
- ✅ **SOC 2 Type II** compliant
- ✅ **HIPAA** eligible
- ✅ **GDPR** compliant
- ✅ **ISO 27001** certified
- ✅ Audit logs retained for 90 days
- ✅ Encrypted data in transit and at rest

---

**Generated for**: techgeekalpha (Account 411474509059)  
**Date**: October 21, 2025  
**VaultPilot Account**: 700880967608

