# VaultPilot - Unified Credential & Secrets Lifecycle Management Platform

VaultPilot automates discovery → rotation → storage → reload → audit across every environment. It delivers zero-downtime key refreshes, compliance dashboards, and simple DevOps integration.

## 🏗️ Architecture

- **Frontend**: React + Tailwind CSS dashboard
- **Backend**: AWS Lambda microservices
- **Database**: DynamoDB for metadata, SSM/Secrets Manager for secrets
- **Authentication**: AWS Cognito
- **Infrastructure**: Terraform + Terragrunt

## 📁 Project Structure

```
vaultpilot/
├── frontend/                 # React dashboard
├── backend/                  # Lambda functions
├── infrastructure/           # Terraform modules
├── docs/                    # Documentation
└── scripts/                 # Deployment scripts
```

## 🚀 Quick Start

1. Deploy infrastructure: `cd infrastructure && terraform apply`
2. Deploy backend: `cd backend && npm run deploy`
3. Deploy frontend: `cd frontend && npm run build && npm run deploy`

## 💰 Pricing

- **Free**: 5 secrets, alerts only
- **Pro**: 25 secrets, email + Slack ($29/month)
- **Business**: 100 secrets, multi-cloud ($99/month)
- **Enterprise**: Unlimited + on-prem ($299/month)
