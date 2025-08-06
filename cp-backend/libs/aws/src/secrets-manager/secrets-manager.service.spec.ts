/**
 * secrets-manager.service.spec.ts
 * Author: Insurance Portal Development Team
 * Description: Unit tests for SecretsManagerService
 * Module: Insurance Property Portal Backend - AWS Library
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@app/logger';
import { SecretsManagerService } from './secrets-manager.service';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

// Mock the AWS SDK
jest.mock('@aws-sdk/client-secrets-manager');

describe('SecretsManagerService', () => {
  let service: SecretsManagerService;
  let mockLogger: jest.Mocked<Logger>;
  let mockSecretsManagerClient: jest.Mocked<SecretsManagerClient>;

  beforeEach(async () => {
    // Create mock logger
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    // Create mock SecretsManager client
    mockSecretsManagerClient = {
      send: jest.fn(),
    } as any;

    // Mock the SecretsManagerClient constructor
    (SecretsManagerClient as jest.Mock).mockImplementation(() => mockSecretsManagerClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecretsManagerService,
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<SecretsManagerService>(SecretsManagerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialize with correct AWS region', () => {
    expect(SecretsManagerClient).toHaveBeenCalledWith({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  });

  describe('getItsSystemAuthKey', () => {
    it('should retrieve auth key from secrets manager', async () => {
      const mockSecret = { auth_key: 'test-auth-key' };
      mockSecretsManagerClient.send.mockResolvedValue({
        SecretString: JSON.stringify(mockSecret),
      });

      const result = await service.getItsSystemAuthKey();

      expect(result).toBe('test-auth-key');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Fetching secret from AWS Secrets Manager')
      );
    });

    it('should use cached value on subsequent calls', async () => {
      const mockSecret = { auth_key: 'cached-auth-key' };
      mockSecretsManagerClient.send.mockResolvedValue({
        SecretString: JSON.stringify(mockSecret),
      });

      // First call
      const result1 = await service.getItsSystemAuthKey();
      expect(result1).toBe('cached-auth-key');

      // Second call should use cache
      const result2 = await service.getItsSystemAuthKey();
      expect(result2).toBe('cached-auth-key');

      // Secrets Manager should only be called once
      expect(mockSecretsManagerClient.send).toHaveBeenCalledTimes(1);
    });

    it('should fallback to environment variable on error', async () => {
      process.env.ITS_SYSTEM_AUTH_KEY = 'fallback-key';
      mockSecretsManagerClient.send.mockRejectedValue(new Error('Secrets Manager error'));

      const result = await service.getItsSystemAuthKey();

      expect(result).toBe('fallback-key');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to retrieve ITS System auth key:',
        expect.any(Error)
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Using fallback ITS_SYSTEM_AUTH_KEY environment variable'
      );

      // Clean up
      delete process.env.ITS_SYSTEM_AUTH_KEY;
    });

    it('should throw error when no auth key found and no fallback', async () => {
      mockSecretsManagerClient.send.mockResolvedValue({
        SecretString: JSON.stringify({ other_key: 'value' }),
      });

      await expect(service.getItsSystemAuthKey()).rejects.toThrow(
        'auth_key not found in ITS System secrets'
      );
    });
  });

  describe('cache management', () => {
    it('should clear specific secret from cache', async () => {
      const mockSecret = { auth_key: 'test-key' };
      mockSecretsManagerClient.send.mockResolvedValue({
        SecretString: JSON.stringify(mockSecret),
      });

      // Get secret to populate cache
      await service.getItsSystemAuthKey();

      // Clear cache
      service.clearSecretCache('third-party/its-api/auth-key');

      // Next call should fetch from AWS again
      await service.getItsSystemAuthKey();

      expect(mockSecretsManagerClient.send).toHaveBeenCalledTimes(2);
    });

    it('should clear all cache', async () => {
      const mockSecret = { auth_key: 'test-key' };
      mockSecretsManagerClient.send.mockResolvedValue({
        SecretString: JSON.stringify(mockSecret),
      });

      // Get secret to populate cache
      await service.getItsSystemAuthKey();

      // Clear all cache
      service.clearAllCache();

      // Next call should fetch from AWS again
      await service.getItsSystemAuthKey();

      expect(mockSecretsManagerClient.send).toHaveBeenCalledTimes(2);
    });
  });
});
