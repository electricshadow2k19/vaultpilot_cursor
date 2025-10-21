# 🔧 Hardcoded Values - Issues & Fixes

**Date**: October 21, 2025  
**Status**: ⚠️ **Action Required**

---

## ❌ **Current Hardcoded Values:**

### **1. API Endpoint (CRITICAL)** 🔴

**Hardcoded in 6 files:**
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/Accounts.tsx`
- `frontend/src/pages/Credentials.tsx`
- `frontend/src/pages/Audit.tsx`
- `frontend/src/pages/Dashboard-New.tsx`
- `frontend/src/pages/Dashboard-Old-Backup.tsx`

**Current code:**
```javascript
const API_ENDPOINT = 'https://t9abv3wghl.execute-api.us-east-1.amazonaws.com';
```

**Problem:**
- Cannot easily change API endpoint for different environments (dev/staging/prod)
- Hard to deploy to different AWS accounts
- Security risk if API Gateway ID is exposed

---

### **2. AWS Account ID (Minor)** ⚠️

**Location:** `frontend/src/pages/Accounts.tsx` line 270

**Current:**
```javascript
<code>700880967608</code>
```

**Impact:** Low - Only shown in UI help text

---

### **3. DynamoDB Table Names** ✅ **GOOD!**

**Backend properly uses environment variables:**
```javascript
const ACCOUNTS_TABLE = process.env.ACCOUNTS_TABLE || 'vaultpilot-accounts-prod';
```

✅ This is fine - has fallback but can be overridden

---

## ✅ **Solution Created:**

### **New Configuration File:**

Created: `frontend/src/config.ts`

```typescript
export const config = {
  apiEndpoint: process.env.REACT_APP_API_ENDPOINT || 'https://t9abv3wghl.execute-api.us-east-1.amazonaws.com',
  vaultPilotAccountId: process.env.REACT_APP_VAULTPILOT_ACCOUNT_ID || '700880967608',
  environment: process.env.REACT_APP_ENVIRONMENT || 'production',
};
```

---

## 🔧 **How to Fix (Required Changes):**

### **Step 1: Update Each Frontend File**

Replace this pattern:
```javascript
// OLD:
const API_ENDPOINT = 'https://t9abv3wghl.execute-api.us-east-1.amazonaws.com';

// NEW:
import config from '../config';
const API_ENDPOINT = config.apiEndpoint;
```

**Files to update:**
1. ✅ `frontend/src/pages/Dashboard.tsx` 
2. ✅ `frontend/src/pages/Accounts.tsx`
3. ✅ `frontend/src/pages/Credentials.tsx`
4. ✅ `frontend/src/pages/Audit.tsx`
5. ✅ `frontend/src/pages/Dashboard-New.tsx`
6. ✅ `frontend/src/pages/Dashboard-Old-Backup.tsx`

---

### **Step 2: Update Account ID in Help Text**

In `frontend/src/pages/Accounts.tsx` line 270:

```javascript
// OLD:
<code className="bg-blue-100 px-2 py-1 rounded">700880967608</code>

// NEW:
import config from '../config';
<code className="bg-blue-100 px-2 py-1 rounded">{config.vaultPilotAccountId}</code>
```

---

### **Step 3: Create Environment Files**

Create `.env` file in `frontend/` directory:

```bash
# .env (for production)
REACT_APP_API_ENDPOINT=https://t9abv3wghl.execute-api.us-east-1.amazonaws.com
REACT_APP_VAULTPILOT_ACCOUNT_ID=700880967608
REACT_APP_ENVIRONMENT=production
```

Create `.env.example` for documentation:
```bash
# .env.example (template)
REACT_APP_API_ENDPOINT=https://YOUR-API-ID.execute-api.REGION.amazonaws.com
REACT_APP_VAULTPILOT_ACCOUNT_ID=YOUR-ACCOUNT-ID
REACT_APP_ENVIRONMENT=production
```

---

### **Step 4: Update .gitignore**

Add to `frontend/.gitignore`:
```
# Environment variables
.env
.env.local
.env.production.local
.env.development.local
```

**Note:** `.env` should NOT be committed to Git for security!

---

## 🎯 **Benefits After Fix:**

✅ **Easy environment switching**
```bash
# Development
REACT_APP_API_ENDPOINT=https://dev-api.vaultpilot.com

# Staging
REACT_APP_API_ENDPOINT=https://staging-api.vaultpilot.com

# Production
REACT_APP_API_ENDPOINT=https://api.vaultpilot.com
```

✅ **Easy deployment to different AWS accounts**
```bash
# Customer A
REACT_APP_VAULTPILOT_ACCOUNT_ID=111111111111

# Customer B
REACT_APP_VAULTPILOT_ACCOUNT_ID=222222222222
```

✅ **Security - API endpoint not exposed in source code**

✅ **Multi-tenant support - Different configs per deployment**

---

## 📋 **Quick Fix Script:**

Want me to apply these changes automatically?

I can:
1. Update all 6 frontend files to use `config.ts`
2. Update the account ID in help text
3. Add .gitignore entries
4. Rebuild and redeploy

Just let me know!

---

## 🚨 **Current Risk Level:**

| Item | Risk | Impact |
|------|------|--------|
| **API Endpoint Hardcoded** | 🟡 Medium | Difficult to change environments |
| **Account ID in Code** | 🟢 Low | Only affects help text |
| **Security Exposure** | 🟡 Medium | API Gateway ID visible in source |
| **Multi-tenant Support** | 🔴 High | Cannot deploy to different accounts easily |

---

## ✅ **Recommendation:**

**Priority: HIGH** 🔴

Apply the config file fix to:
1. Make deployments easier
2. Support multiple environments
3. Enable multi-tenant deployments
4. Follow security best practices

---

**Next Steps:**
1. Review this document
2. Decide if you want me to apply the fixes
3. I'll update all files and redeploy

---

**Generated**: October 21, 2025  
**Issue**: Hardcoded API endpoints and AWS account IDs  
**Solution**: Centralized config with environment variable support

