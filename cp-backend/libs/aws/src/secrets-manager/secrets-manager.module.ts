/**
 * secrets-manager.module.ts
 * Author: Insurance Portal Development Team
 * Description: NestJS module for AWS Secrets Manager service
 * Module: Insurance Property Portal Backend - AWS Library
 */

import { Module, Global } from '@nestjs/common';
import { SecretsManagerService } from './secrets-manager.service';

@Global()
@Module({
  providers: [SecretsManagerService],
  exports: [SecretsManagerService],
})
export class SecretsManagerModule {}
