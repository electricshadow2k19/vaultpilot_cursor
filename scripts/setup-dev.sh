#!/bin/bash

# VaultPilot Development Setup Script
# This script sets up the development environment for VaultPilot

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛠️  Setting up VaultPilot development environment...${NC}"
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

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the VaultPilot root directory"
    exit 1
fi

# Install frontend dependencies
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd frontend
npm install
print_status "Frontend dependencies installed"

# Install backend dependencies
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd ../backend
npm install
print_status "Backend dependencies installed"

# Install infrastructure dependencies
echo -e "${BLUE}📦 Installing infrastructure dependencies...${NC}"
cd ../infrastructure
# Terraform will handle its own dependencies
print_status "Infrastructure dependencies ready"

# Create development environment files
echo -e "${BLUE}📝 Creating development environment files...${NC}"

# Frontend .env file
cat > ../frontend/.env.local << EOF
# VaultPilot Development Environment
REACT_APP_AWS_REGION=us-east-1
REACT_APP_USER_POOL_ID=your-user-pool-id
REACT_APP_USER_POOL_CLIENT_ID=your-client-id
REACT_APP_API_ENDPOINT=http://localhost:3001
EOF

# Backend environment file
cat > ../backend/.env << EOF
# VaultPilot Backend Environment
NODE_ENV=development
AWS_REGION=us-east-1
DYNAMODB_TABLE=vaultpilot-credentials-dev
SECRETS_MANAGER_PREFIX=vaultpilot/dev
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:vaultpilot-notifications-dev
EOF

print_status "Development environment files created"

# Create VS Code workspace settings
echo -e "${BLUE}⚙️  Creating VS Code workspace settings...${NC}"
mkdir -p .vscode

cat > .vscode/settings.json << EOF
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.terraform": true
  }
}
EOF

cat > .vscode/extensions.json << EOF
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-json",
    "hashicorp.terraform"
  ]
}
EOF

print_status "VS Code workspace settings created"

# Create development scripts
echo -e "${BLUE}📜 Creating development scripts...${NC}"

# Frontend development script
cat > scripts/dev-frontend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting VaultPilot frontend development server..."
cd frontend
npm start
EOF

# Backend development script
cat > scripts/dev-backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting VaultPilot backend development server..."
cd backend
npm run dev
EOF

# Infrastructure development script
cat > scripts/dev-infrastructure.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting VaultPilot infrastructure development..."
cd infrastructure
terraform init
terraform plan -var="environment=dev"
EOF

# Make scripts executable
chmod +x scripts/dev-frontend.sh
chmod +x scripts/dev-backend.sh
chmod +x scripts/dev-infrastructure.sh

print_status "Development scripts created"

# Create Docker Compose for local development
echo -e "${BLUE}🐳 Creating Docker Compose configuration...${NC}"
cat > docker-compose.dev.yml << EOF
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - REACT_APP_AWS_REGION=us-east-1
      - REACT_APP_USER_POOL_ID=your-user-pool-id
      - REACT_APP_USER_POOL_CLIENT_ID=your-client-id
      - REACT_APP_API_ENDPOINT=http://localhost:3001

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - AWS_REGION=us-east-1
      - DYNAMODB_TABLE=vaultpilot-credentials-dev
EOF

print_status "Docker Compose configuration created"

# Create development Dockerfiles
echo -e "${BLUE}🐳 Creating development Dockerfiles...${NC}"

# Frontend Dockerfile
cat > frontend/Dockerfile.dev << EOF
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
EOF

# Backend Dockerfile
cat > backend/Dockerfile.dev << EOF
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]
EOF

print_status "Development Dockerfiles created"

# Create gitignore
echo -e "${BLUE}📝 Creating .gitignore...${NC}"
cat > .gitignore << EOF
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Terraform
.terraform/
*.tfstate
*.tfstate.*
.terraform.lock.hcl

# AWS
.aws/

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/
EOF

print_status ".gitignore created"

# Summary
echo ""
echo -e "${GREEN}🎉 VaultPilot development environment setup completed!${NC}"
echo ""
echo -e "${BLUE}📋 Development Commands:${NC}"
echo -e "  Frontend:     ./scripts/dev-frontend.sh"
echo -e "  Backend:      ./scripts/dev-backend.sh"
echo -e "  Infrastructure: ./scripts/dev-infrastructure.sh"
echo ""
echo -e "${BLUE}🐳 Docker Commands:${NC}"
echo -e "  Start all services: docker-compose -f docker-compose.dev.yml up"
echo -e "  Stop all services:  docker-compose -f docker-compose.dev.yml down"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo -e "  1. Configure AWS credentials: aws configure"
echo -e "  2. Deploy infrastructure: ./scripts/deploy.sh dev"
echo -e "  3. Start development: ./scripts/dev-frontend.sh"
echo ""
echo -e "${GREEN}✨ Happy coding!${NC}"
