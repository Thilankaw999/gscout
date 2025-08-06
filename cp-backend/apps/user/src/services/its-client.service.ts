/**
 * its-client.service.ts
 * Author: Insurance Portal Development Team
 * Description: Service to communicate with the ITS System user backend
 * Module: Insurance Property Portal Backend - User Service
 */

import { Injectable } from '@nestjs/common';
import { Logger } from '@app/logger';
import { ConfigProvider, HttpClientService } from '@app/common';
import { SecretsManagerService } from '@app/aws';
import { ItsSystemUserProfile } from './user-profile-transformation.service';

@Injectable()
export class ItsSystemClientService {
  private readonly httpClient: HttpClientService;

  constructor(
    private readonly logger: Logger,
    private readonly configProvider: ConfigProvider,
    private readonly baseHttpClientService: HttpClientService,
    private readonly secretsManagerService: SecretsManagerService,
  ) {
    // Use local URL for development, production URL for deployed environments
    const isLocalDevelopment = process.env.IS_OFFLINE === 'true';

    const baseUrl = isLocalDevelopment
      ? this.configProvider.get('ITS_SYSTEM_API_BASE_URL.local')
      : this.configProvider.get('ITS_SYSTEM_API_BASE_URL.production');

    // Create configured HTTP client instance
    this.httpClient = this.baseHttpClientService.createClient({
      baseUrl,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getUserProfile(customerEmail: string): Promise<ItsSystemUserProfile> {
    this.logger.debug('ItsSystemClientService: Calling ITS System API', {
      customerEmail,
    });

    // Get auth key from Secrets Manager with caching
    const authKey = await this.secretsManagerService.getItsSystemAuthKey();

    const requestBody = {
      auth_key: authKey,
      customer_email: customerEmail,
    };

    const data = await this.httpClient.post<ItsSystemUserProfile>(
      '/its-system/user',
      requestBody
    );

    return data;
  }
}