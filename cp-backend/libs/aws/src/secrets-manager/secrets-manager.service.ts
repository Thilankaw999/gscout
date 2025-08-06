/**
 * secrets-manager.service.ts
 * Author: Insurance Portal Development Team
 * Description: AWS Secrets Manager service with caching for optimal performance
 * Module: Insurance Property Portal Backend - AWS Library
 */

import { Injectable } from '@nestjs/common';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { 
  SecretValue, 
  CachedSecret, 
  SecretsManagerConfig, 
  ItsSystemSecrets 
} from './secrets-manager.types';

@Injectable()
export class SecretsManagerService {
  private readonly client: SecretsManagerClient;
  private readonly secretsCache = new Map<string, CachedSecret>();
  private readonly defaultCacheTtlMs = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.client = new SecretsManagerClient({});
  }

  /**
   * Retrieves a secret value from AWS Secrets Manager with caching
   * @param secretId - The ARN or name of the secret
   * @param cacheTtlMs - Optional cache TTL in milliseconds
   * @returns Promise<SecretValue>
   */
  async getSecret(secretId: string, cacheTtlMs?: number): Promise<SecretValue> {
    const ttl = cacheTtlMs || this.defaultCacheTtlMs;
    
    // Check cache first
    const cachedSecret = this.getCachedSecret(secretId, ttl);
    if (cachedSecret) {
      console.debug(`[SecretsManager] Using cached secret for: ${secretId}`);
      return cachedSecret.value;
    }

    console.debug(`[SecretsManager] Fetching secret from AWS Secrets Manager: ${secretId}`);

    try {
      const command = new GetSecretValueCommand({
        SecretId: secretId,
      });

      const response = await this.client.send(command);
      
      if (!response.SecretString) {
        throw new Error(`Secret ${secretId} does not contain a SecretString`);
      }

      const secretValue = JSON.parse(response.SecretString);
      
      // Cache the secret
      this.cacheSecret(secretId, secretValue, ttl);
      
      console.debug(`[SecretsManager] Successfully fetched and cached secret: ${secretId}`);
      return secretValue;

    } catch (error) {
      console.error(`[SecretsManager] Failed to retrieve secret ${secretId}:`, error);
      throw new Error(`Failed to retrieve secret: ${error.message}`);
    }
  }

  /**
   * Specifically retrieves ITS System auth credentials
   * @returns Promise<ItsSystemSecrets>
   */
  async getItsSystemAuthKey(): Promise<string> {
    try {
      // Use environment variable to determine secret name/ARN
      const secretId = process.env.ITS_SYSTEM_SECRET_ARN || 'third-party/its-api/auth-key';
      
      const secrets = await this.getSecret(secretId) as ItsSystemSecrets;
      
      if (!secrets.auth_key) {
        throw new Error('auth_key not found in ITS System secrets');
      }

      return secrets.auth_key;
    } catch (error) {
      console.error('[SecretsManager] Failed to retrieve ITS System auth key:', error);
      
      // Fallback to environment variable for local development
      const fallbackKey = process.env.ITS_SYSTEM_AUTH_KEY;
      if (fallbackKey) {
        console.warn('[SecretsManager] Using fallback ITS_SYSTEM_AUTH_KEY environment variable');
        return fallbackKey;
      }
      
      throw error;
    }
  }

  /**
   * Clears a specific secret from cache
   * @param secretId - The secret ID to clear
   */
  clearSecretCache(secretId: string): void {
    this.secretsCache.delete(secretId);
    console.debug(`[SecretsManager] Cleared cache for secret: ${secretId}`);
  }

  /**
   * Clears all cached secrets
   */
  clearAllCache(): void {
    this.secretsCache.clear();
    console.debug('[SecretsManager] Cleared all secrets cache');
  }

  /**
   * Gets cached secret if it exists and hasn't expired
   * @private
   */
  private getCachedSecret(secretId: string, ttl: number): CachedSecret | null {
    const cached = this.secretsCache.get(secretId);
    
    if (!cached) {
      return null;
    }

    const now = Date.now();
    const isExpired = (now - cached.timestamp) > ttl;
    
    if (isExpired) {
      this.secretsCache.delete(secretId);
      return null;
    }

    return cached;
  }

  /**
   * Caches a secret value
   * @private
   */
  private cacheSecret(secretId: string, value: SecretValue, ttl: number): void {
    const cachedSecret: CachedSecret = {
      value,
      timestamp: Date.now(),
      ttl,
    };
    
    this.secretsCache.set(secretId, cachedSecret);
  }
}
