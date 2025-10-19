// Accounts API with AWS SDK v3
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand, UpdateCommand, DeleteCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { STSClient, AssumeRoleCommand, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
const { IAMClient, ListUsersCommand, ListAccessKeysCommand } = require('@aws-sdk/client-iam');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const ddbClient = new DynamoDBClient({ region: 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(ddbClient);

const ACCOUNTS_TABLE = process.env.ACCOUNTS_TABLE || 'vaultpilot-accounts-prod';
const CREDENTIALS_TABLE = process.env.CREDENTIALS_TABLE || 'vaultpilot-credentials-prod';

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

exports.handler = async (event) => {
  console.log('Accounts API:', event.httpMethod, event.path);
  
  // Handle OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path || event.rawPath || '/accounts';
  const method = event.httpMethod || event.requestContext?.http?.method;

  try {
    // GET /accounts - List all accounts
    if (method === 'GET' && path === '/accounts') {
      return await listAccounts();
    }
    
    // POST /accounts - Add new account
    if (method === 'POST' && path === '/accounts') {
      const body = JSON.parse(event.body);
      return await addAccount(body);
    }
    
    // POST /accounts/{id}/scan - Scan account for credentials
    if (method === 'POST' && path.includes('/scan')) {
      const accountId = path.split('/')[2];
      return await scanAccount(accountId);
    }
    
    // POST /accounts/{id}/test - Test connection
    if (method === 'POST' && path.includes('/test')) {
      const accountId = path.split('/')[2];
      return await testConnection(accountId);
    }
    
    // DELETE /accounts/{id} - Remove account
    if (method === 'DELETE' && path.match(/\/accounts\/[^\/]+$/)) {
      const accountId = path.split('/')[2];
      return await deleteAccount(accountId);
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Not found' })
    };
    
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function listAccounts() {
  const result = await dynamodb.send(new ScanCommand({
    TableName: ACCOUNTS_TABLE
  }));

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      accounts: result.Items || [],
      count: result.Items?.length || 0
    })
  };
}

async function addAccount(data) {
  const { accountName, accountId, roleArn, externalId, regions } = data;
  
  const timestamp = new Date().toISOString();
  const account = {
    id: accountId,
    accountName,
    accountId,
    roleArn,
    externalId,
    regions: regions || ['us-east-1'],
    status: 'pending',
    createdAt: timestamp,
    lastScan: null,
    credentialsFound: 0
  };

  await dynamodb.send(new PutCommand({
    TableName: ACCOUNTS_TABLE,
    Item: account
  }));

  // Test connection automatically
  try {
    await testConnectionInternal(accountId, roleArn, externalId);
    
    // If successful, scan for credentials
    await scanAccountInternal(accountId, roleArn, externalId);
  } catch (error) {
    console.error('Error during initial scan:', error);
  }

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({ account, message: 'Account added, scanning...' })
  };
}

async function testConnection(accountId) {
  const account = await getAccount(accountId);
  if (!account) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Account not found' }) };
  }

  await testConnectionInternal(accountId, account.roleArn, account.externalId);
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'Connection successful', status: 'active' })
  };
}

async function testConnectionInternal(accountId, roleArn, externalId) {
  const stsClient = new STSClient({ region: 'us-east-1' });
  
  const assumeRoleCommand = new AssumeRoleCommand({
    RoleArn: roleArn,
    RoleSessionName: `VaultPilot-${Date.now()}`,
    ExternalId: externalId
  });

  const assumedRole = await stsClient.send(assumeRoleCommand);
  
  // Update status to active
  await dynamodb.send(new UpdateCommand({
    TableName: ACCOUNTS_TABLE,
    Key: { id: accountId },
    UpdateExpression: 'SET #status = :status, lastTested = :timestamp',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':status': 'active',
      ':timestamp': new Date().toISOString()
    }
  }));

  return assumedRole;
}

async function scanAccount(accountId) {
  const account = await getAccount(accountId);
  if (!account) {
    return { statusCode: 404, headers, body: JSON.stringify({ error: 'Account not found' }) };
  }

  const result = await scanAccountInternal(accountId, account.roleArn, account.externalId);
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result)
  };
}

async function scanAccountInternal(accountId, roleArn, externalId) {
  console.log(`Scanning account ${accountId} for credentials...`);
  
  // Assume role
  const stsClient = new STSClient({ region: 'us-east-1' });
  const assumedRole = await stsClient.send(new AssumeRoleCommand({
    RoleArn: roleArn,
    RoleSessionName: `VaultPilot-Scan-${Date.now()}`,
    ExternalId: externalId
  }));

  const credentials = {
    accessKeyId: assumedRole.Credentials.AccessKeyId,
    secretAccessKey: assumedRole.Credentials.SecretAccessKey,
    sessionToken: assumedRole.Credentials.SessionToken
  };

  // Create IAM client with assumed role
  const iamClient = new IAMClient({
    region: 'us-east-1',
    credentials
  });

  // List IAM users
  const usersResult = await iamClient.send(new ListUsersCommand({}));
  const users = usersResult.Users || [];
  
  let totalKeys = 0;
  const timestamp = new Date().toISOString();

  // Scan each user's access keys
  for (const user of users) {
    const keysResult = await iamClient.send(new ListAccessKeysCommand({
      UserName: user.UserName
    }));

    for (const key of keysResult.AccessKeyMetadata || []) {
      totalKeys++;
      
      // Add to credentials table
      await dynamodb.send(new PutCommand({
        TableName: CREDENTIALS_TABLE,
        Item: {
          id: `iam-key-${accountId}-${key.AccessKeyId}`,
          name: `${user.UserName}/${key.AccessKeyId}`,
          type: 'AWS_IAM_KEY',
          tenantId: accountId,
          accountId,
          environment: 'production',
          status: key.Status === 'Active' ? 'active' : 'inactive',
          source: 'IAM',
          lastRotated: key.CreateDate || timestamp,
          createdAt: key.CreateDate || timestamp,
          updatedAt: timestamp,
          expiresIn: 90,
          metadata: {
            userName: user.UserName,
            accessKeyId: key.AccessKeyId
          }
        }
      }));
    }
  }

  // Update account with scan results
  await dynamodb.send(new UpdateCommand({
    TableName: ACCOUNTS_TABLE,
    Key: { id: accountId },
    UpdateExpression: 'SET credentialsFound = :count, lastScan = :timestamp, #status = :status',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':count': totalKeys,
      ':timestamp': timestamp,
      ':status': 'active'
    }
  }));

  return {
    message: `Scan complete. Found ${totalKeys} IAM access keys.`,
    credentialsFound: totalKeys,
    users: users.length
  };
}

async function deleteAccount(accountId) {
  await dynamodb.send(new DeleteCommand({
    TableName: ACCOUNTS_TABLE,
    Key: { id: accountId }
  }));

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'Account deleted' })
  };
}

async function getAccount(accountId) {
  const result = await dynamodb.send(new GetCommand({
    TableName: ACCOUNTS_TABLE,
    Key: { id: accountId }
  }));
  return result.Item;
}

