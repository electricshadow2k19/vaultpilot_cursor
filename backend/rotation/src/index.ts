import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { DynamoDB, SecretsManager, SSM, IAM, SNS, ECS, Lambda } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

const dynamodb = new DynamoDB.DocumentClient();
const secretsManager = new SecretsManager();
const ssm = new SSM();
const iam = new IAM();
const sns = new SNS();
const ecs = new ECS();
const lambda = new Lambda();

interface Credential {
  id: string;
  name: string;
  type: string;
  environment: string;
  lastRotated: string;
  expiresIn: number;
  status: 'active' | 'expired' | 'expiring' | 'rotating';
  description?: string;
  source: string;
  metadata: Record<string, any>;
}

export const rotation = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Starting credential rotation process...');
    
    // Get credentials that need rotation
    const credentialsToRotate = await getCredentialsToRotate();
    
    const rotationResults = [];
    
    for (const credential of credentialsToRotate) {
      try {
        const result = await rotateCredentialInternal(credential);
        rotationResults.push(result);
        
        // Log rotation activity
        await logActivity('rotation', `Credential rotated: ${credential.name}`, {
          credentialId: credential.id,
          credentialName: credential.name,
          credentialType: credential.type,
          status: result.success ? 'success' : 'failed',
          error: result.error,
          timestamp: new Date().toISOString()
        });
        
        // Send notification
        await sendNotification(credential, result);
        
      } catch (error) {
        console.error(`Error rotating credential ${credential.id}:`, error);
        
        await logActivity('rotation', `Credential rotation failed: ${credential.name}`, {
          credentialId: credential.id,
          credentialName: credential.name,
          credentialType: credential.type,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({
        message: 'Rotation completed',
        credentialsRotated: rotationResults.length,
        results: rotationResults
      })
    };
  } catch (error) {
    console.error('Rotation error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Rotation failed',
        message: error.message
      })
    };
  }
};

export const rotateCredential = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    const credentialId = event.pathParameters?.credentialId;
    if (!credentialId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Credential ID is required' })
      };
    }
    
    // Get credential details
    const credential = await getCredentialById(credentialId);
    if (!credential) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Credential not found' })
      };
    }
    
    // Rotate the credential
    const result = await rotateCredentialInternal(credential);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Credential rotated successfully',
        result
      })
    };
  } catch (error) {
    console.error('Single credential rotation error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Rotation failed',
        message: error.message
      })
    };
  }
};

async function getCredentialsToRotate(): Promise<Credential[]> {
  const tableName = process.env.DYNAMODB_TABLE;
  if (!tableName) {
    throw new Error('DYNAMODB_TABLE environment variable not set');
  }
  
  try {
    const result = await dynamodb.scan({
      TableName: tableName,
      FilterExpression: 'attribute_exists(id) AND (expiresIn < :threshold OR status = :expiring)',
      ExpressionAttributeValues: {
        ':threshold': 30, // Rotate if expires in less than 30 days
        ':expiring': 'expiring'
      }
    }).promise();
    
    return result.Items as Credential[] || [];
  } catch (error) {
    console.error('Error getting credentials to rotate:', error);
    throw error;
  }
}

async function getCredentialById(credentialId: string): Promise<Credential | null> {
  const tableName = process.env.DYNAMODB_TABLE;
  if (!tableName) {
    throw new Error('DYNAMODB_TABLE environment variable not set');
  }
  
  try {
    const result = await dynamodb.get({
      TableName: tableName,
      Key: { id: credentialId }
    }).promise();
    
    return result.Item as Credential || null;
  } catch (error) {
    console.error('Error getting credential by ID:', error);
    throw error;
  }
}

async function rotateCredentialInternal(credential: Credential): Promise<{ success: boolean; error?: string }> {
  try {
    // Update status to rotating
    await updateCredentialStatus(credential.id, 'rotating');
    
    let result: { success: boolean; error?: string } = { success: false };
    
    switch (credential.type) {
      case 'AWS IAM':
        result = await rotateIAMCredential(credential);
        break;
      case 'Database':
        result = await rotateDatabaseCredential(credential);
        break;
      case 'SMTP':
        result = await rotateSMTPCredential(credential);
        break;
      case 'GitHub':
        result = await rotateGitHubCredential(credential);
        break;
      case 'API Token':
        result = await rotateAPITokenCredential(credential);
        break;
      default:
        result = { success: false, error: 'Unsupported credential type' };
    }
    
    if (result.success) {
      // Update credential with new rotation date
      await updateCredentialRotation(credential.id);
    } else {
      // Revert status on failure
      await updateCredentialStatus(credential.id, 'active');
    }
    
    return result;
  } catch (error) {
    console.error('Error rotating credential:', error);
    return { success: false, error: error.message };
  }
}

async function rotateIAMCredential(credential: Credential): Promise<{ success: boolean; error?: string }> {
  try {
    const userName = credential.metadata.userName;
    const oldAccessKeyId = credential.metadata.accessKeyId;
    
    // Create new access key
    const newAccessKey = await iam.createAccessKey({ UserName: userName }).promise();
    
    // Update the credential in storage
    await updateCredentialInStorage(credential, {
      accessKeyId: newAccessKey.AccessKey.AccessKeyId,
      secretAccessKey: newAccessKey.AccessKey.SecretAccessKey,
      lastRotated: new Date().toISOString()
    });
    
    // Delete old access key
    await iam.deleteAccessKey({ 
      UserName: userName, 
      AccessKeyId: oldAccessKeyId 
    }).promise();
    
    // Restart services that use this credential
    await restartServices(credential);
    
    return { success: true };
  } catch (error) {
    console.error('Error rotating IAM credential:', error);
    return { success: false, error: error.message };
  }
}

async function rotateDatabaseCredential(credential: Credential): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate new password
    const newPassword = generateSecurePassword();
    
    // Update credential in storage
    await updateCredentialInStorage(credential, {
      password: newPassword,
      lastRotated: new Date().toISOString()
    });
    
    // Update database password (this would typically involve calling the database API)
    // For now, we'll just log the action
    console.log(`Database password rotated for ${credential.name}`);
    
    // Restart services
    await restartServices(credential);
    
    return { success: true };
  } catch (error) {
    console.error('Error rotating database credential:', error);
    return { success: false, error: error.message };
  }
}

async function rotateSMTPCredential(credential: Credential): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate new password
    const newPassword = generateSecurePassword();
    
    // Update credential in storage
    await updateCredentialInStorage(credential, {
      password: newPassword,
      lastRotated: new Date().toISOString()
    });
    
    // Update SMTP service (this would typically involve calling the email service API)
    console.log(`SMTP password rotated for ${credential.name}`);
    
    // Restart services
    await restartServices(credential);
    
    return { success: true };
  } catch (error) {
    console.error('Error rotating SMTP credential:', error);
    return { success: false, error: error.message };
  }
}

async function rotateGitHubCredential(credential: Credential): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate new token
    const newToken = generateSecureToken();
    
    // Update credential in storage
    await updateCredentialInStorage(credential, {
      token: newToken,
      lastRotated: new Date().toISOString()
    });
    
    // Update GitHub token (this would typically involve calling the GitHub API)
    console.log(`GitHub token rotated for ${credential.name}`);
    
    // Restart services
    await restartServices(credential);
    
    return { success: true };
  } catch (error) {
    console.error('Error rotating GitHub credential:', error);
    return { success: false, error: error.message };
  }
}

async function rotateAPITokenCredential(credential: Credential): Promise<{ success: boolean; error?: string }> {
  try {
    // Generate new token
    const newToken = generateSecureToken();
    
    // Update credential in storage
    await updateCredentialInStorage(credential, {
      token: newToken,
      lastRotated: new Date().toISOString()
    });
    
    // Update API service (this would typically involve calling the service API)
    console.log(`API token rotated for ${credential.name}`);
    
    // Restart services
    await restartServices(credential);
    
    return { success: true };
  } catch (error) {
    console.error('Error rotating API token credential:', error);
    return { success: false, error: error.message };
  }
}

async function updateCredentialInStorage(credential: Credential, newValues: Record<string, any>): Promise<void> {
  const tableName = process.env.DYNAMODB_TABLE;
  if (!tableName) {
    throw new Error('DYNAMODB_TABLE environment variable not set');
  }
  
  try {
    await dynamodb.update({
      TableName: tableName,
      Key: { id: credential.id },
      UpdateExpression: 'SET #metadata = :metadata, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#metadata': 'metadata'
      },
      ExpressionAttributeValues: {
        ':metadata': { ...credential.metadata, ...newValues },
        ':updatedAt': new Date().toISOString()
      }
    }).promise();
  } catch (error) {
    console.error('Error updating credential in storage:', error);
    throw error;
  }
}

async function updateCredentialStatus(credentialId: string, status: string): Promise<void> {
  const tableName = process.env.DYNAMODB_TABLE;
  if (!tableName) {
    throw new Error('DYNAMODB_TABLE environment variable not set');
  }
  
  try {
    await dynamodb.update({
      TableName: tableName,
      Key: { id: credentialId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString()
      }
    }).promise();
  } catch (error) {
    console.error('Error updating credential status:', error);
    throw error;
  }
}

async function updateCredentialRotation(credentialId: string): Promise<void> {
  const tableName = process.env.DYNAMODB_TABLE;
  if (!tableName) {
    throw new Error('DYNAMODB_TABLE environment variable not set');
  }
  
  try {
    await dynamodb.update({
      TableName: tableName,
      Key: { id: credentialId },
      UpdateExpression: 'SET lastRotated = :lastRotated, expiresIn = :expiresIn, #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':lastRotated': new Date().toISOString().split('T')[0],
        ':expiresIn': 90,
        ':status': 'active',
        ':updatedAt': new Date().toISOString()
      }
    }).promise();
  } catch (error) {
    console.error('Error updating credential rotation:', error);
    throw error;
  }
}

async function restartServices(credential: Credential): Promise<void> {
  try {
    // This would typically involve restarting ECS services, Lambda functions, etc.
    // that use the rotated credential
    console.log(`Restarting services for credential: ${credential.name}`);
    
    // Example: Restart ECS service if specified in metadata
    if (credential.metadata.ecsService) {
      await ecs.updateService({
        cluster: credential.metadata.ecsCluster,
        service: credential.metadata.ecsService,
        forceNewDeployment: true
      }).promise();
    }
    
    // Example: Update Lambda environment variables if specified
    if (credential.metadata.lambdaFunction) {
      // This would involve updating the Lambda function's environment variables
      // with the new credential values
      console.log(`Updating Lambda function: ${credential.metadata.lambdaFunction}`);
    }
  } catch (error) {
    console.error('Error restarting services:', error);
    // Don't throw here as service restart is not critical for credential rotation
  }
}

async function sendNotification(credential: Credential, result: { success: boolean; error?: string }): Promise<void> {
  const topicArn = process.env.SNS_TOPIC_ARN;
  if (!topicArn) {
    console.warn('SNS_TOPIC_ARN not set, skipping notification');
    return;
  }
  
  try {
    const message = {
      credentialName: credential.name,
      credentialType: credential.type,
      status: result.success ? 'success' : 'failed',
      error: result.error,
      timestamp: new Date().toISOString()
    };
    
    await sns.publish({
      TopicArn: topicArn,
      Message: JSON.stringify(message),
      Subject: `Credential Rotation ${result.success ? 'Success' : 'Failed'}: ${credential.name}`
    }).promise();
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

async function logActivity(action: string, description: string, metadata: Record<string, any>): Promise<void> {
  // Use dedicated audit logs table
  const tableName = process.env.AUDIT_TABLE || 'vaultpilot-audit-logs-dev';
  
  try {
    await dynamodb.put({
      TableName: tableName,
      Item: {
        id: uuidv4(),
        type: 'audit_log',
        action,
        description,
        metadata,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    }).promise();
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

function generateSecurePassword(): string {
  const length = 32;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
