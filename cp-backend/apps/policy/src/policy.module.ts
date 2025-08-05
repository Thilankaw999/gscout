/**
 * policy.module.ts
 * Author: Insurance Portal Development Team
 * Description: Module to handle policy, claims, and documents operations in Insurance Property Portal
 * Module: Insurance Property Portal Backend
 */

import { Module } from '@nestjs/common';
import { BaseAPIModule } from '@app/common';
import { DbModule } from '@app/db';
import { S3Module } from '@app/aws/s3';
import { PolicyApiController } from './policy.controller';

// Use Cases
import { GetPoliciesUseCase } from './queries/get-policies/get-policies.usecase';
import { GetClaimsUseCase } from './queries/get-claims/get-claims.usecase';
import { GetDocumentsUseCase } from './queries/get-documents/get-documents.usecase';
import { DownloadDocumentUseCase } from './queries/download-document/download-document.usecase';

@Module({
  imports: [BaseAPIModule, DbModule, S3Module],
  controllers: [PolicyApiController],
  providers: [
    GetPoliciesUseCase,
    GetClaimsUseCase,
    GetDocumentsUseCase,
    DownloadDocumentUseCase,
  ],
  exports: [],
})
export class PolicyApiModule {} 