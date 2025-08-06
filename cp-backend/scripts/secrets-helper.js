#!/usr/bin/env node

/**
 * secrets-helper.js
 * Author: Insurance Portal Development Team
 * Description: Helper script for managing secrets in different environments
 * Usage: 
 *   - Local development: Uses ITS_SYSTEM_AUTH_KEY environment variable
 *   - AWS environments: Uses AWS Secrets Manager
 */

const { SecretsManagerClient, GetSecretValueCommand, CreateSecretCommand, PutSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const crypto = require('crypto');

class SecretsHelper {
  constructor() {
    this.client = new SecretsManagerClient({});
  }

  /**
   * Test the secrets manager connection
   */
  async testConnection() {
    try {
      console.log('Testing AWS Secrets Manager connection...');
      
      const secretId = process.env.ITS_SYSTEM_SECRET_ARN || 'third-party/its-api/auth-key';
      
      const command = new GetSecretValueCommand({
        SecretId: secretId,
      });

      const response = await this.client.send(command);
      
      if (response.SecretString) {
        const secrets = JSON.parse(response.SecretString);
        console.log('✅ Successfully connected to AWS Secrets Manager');
        console.log('Secret keys found:', Object.keys(secrets));
        return true;
      }
    } catch (error) {
      console.log('❌ Failed to connect to AWS Secrets Manager:', error.message);
      console.log('💡 For local development, make sure ITS_SYSTEM_AUTH_KEY environment variable is set');
      return false;
    }
  }

  /**
   * Create a sample secret structure for testing
   */
  async createSampleSecret() {
    console.log('Sample secret structure for AWS Secrets Manager:');
    console.log(JSON.stringify({
      auth_key: "your-its-system-auth-key-here"
    }, null, 2));
  }

  /**
   * Generate a random dummy auth key
   * @returns {string} A randomly generated auth key
   */
  generateDummyAuthKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a dummy secret for ITS System authentication
   * @param {string} [secretName='third-party/its-api/auth-key'] - Name of the secret
   * @param {string} [authKey] - Optional custom auth key, otherwise generates a random one
   */
  async createDummySecret(secretName = 'third-party/its-api/auth-key', authKey) {
    try {
      // Generate or use provided auth key
      const dummyAuthKey = authKey || this.generateDummyAuthKey();

      // Secret structure
      const secretValue = JSON.stringify({
        auth_key: dummyAuthKey
      });

      console.log('🔑 Generating Dummy Secret:');
      console.log(`Secret Name: ${secretName}`);
      console.log(`Generated Auth Key: ${dummyAuthKey}`);

      // Create the secret
      const createCommand = new CreateSecretCommand({
        Name: secretName,
        Description: 'Dummy ITS System Authentication Key for Local Development',
        SecretString: secretValue
      });

      const createResponse = await this.client.send(createCommand);
      console.log('✅ Secret created successfully');
      console.log('Secret ARN:', createResponse.ARN);

      return dummyAuthKey;
    } catch (error) {
      console.error('❌ Failed to create secret:', error.message);
      
      // Check if secret already exists (update instead)
      if (error.name === 'ResourceExistsException') {
        try {
          const updateCommand = new PutSecretValueCommand({
            SecretId: secretName,
            SecretString: JSON.stringify({
              auth_key: authKey || this.generateDummyAuthKey()
            })
          });

          const updateResponse = await this.client.send(updateCommand);
          console.log('🔄 Existing secret updated');
          console.log('Updated Secret Version:', updateResponse.VersionId);
        } catch (updateError) {
          console.error('❌ Failed to update existing secret:', updateError.message);
        }
      }
    }
  }
}

// CLI usage
if (require.main === module) {
  const helper = new SecretsHelper();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'test':
      helper.testConnection();
      break;
    case 'sample':
      helper.createSampleSecret();
      break;
    case 'create-secret':
      const customKey = process.argv[3]; // Optional custom key
      helper.createDummySecret(undefined, customKey);
      break;
    default:
      console.log(`
AWS Secrets Manager Helper

Usage:
  node scripts/secrets-helper.js test               - Test connection to AWS Secrets Manager
  node scripts/secrets-helper.js sample             - Show sample secret structure
  node scripts/secrets-helper.js create-secret      - Create a dummy secret with random auth key
  node scripts/secrets-helper.js create-secret CUSTOM_KEY  - Create a secret with a custom key

Environment Variables:
  AWS_REGION                - AWS region for Secrets Manager (default: us-east-1)
  ITS_SYSTEM_SECRET_ARN     - ARN or name of the secret (default: third-party/its-api/auth-key)
  ITS_SYSTEM_AUTH_KEY       - Fallback auth key for local development
`);
  }
}

module.exports = SecretsHelper;
