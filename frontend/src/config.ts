// VaultPilot Frontend Configuration
// Centralized configuration to avoid hardcoded values

export const config = {
  // API Gateway Endpoint - can be overridden via environment variable
  apiEndpoint: process.env.REACT_APP_API_ENDPOINT || 'https://t9abv3wghl.execute-api.us-east-1.amazonaws.com',
  
  // VaultPilot AWS Account ID (for customer onboarding instructions)
  vaultPilotAccountId: process.env.REACT_APP_VAULTPILOT_ACCOUNT_ID || '700880967608',
  
  // Environment
  environment: process.env.REACT_APP_ENVIRONMENT || 'production',
  
  // Feature flags
  features: {
    enableRotation: true,
    enableDiscovery: true,
    enableAuditLogs: true,
  },
  
  // Default settings
  defaults: {
    rotationInterval: 90, // days
    scanInterval: 24, // hours
  },
};

export default config;

