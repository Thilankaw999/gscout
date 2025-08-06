/**
 * secrets-manager.types.ts
 * Author: Insurance Portal Development Team
 * Description: Types for Secrets Manager service
 * Module: Insurance Property Portal Backend - AWS Library
 */

export interface SecretValue {
  [key: string]: any;
}

export interface CachedSecret {
  value: SecretValue;
  timestamp: number;
  ttl: number;
}

export interface SecretsManagerConfig {
  region?: string;
  cacheTtlMs?: number;
}

export interface ItsSystemSecrets {
  auth_key: string;
}
