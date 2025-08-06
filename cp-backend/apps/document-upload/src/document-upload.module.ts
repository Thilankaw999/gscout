/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: Document Upload Module
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import { Module } from '@nestjs/common';
import { DocumentUploadController } from './document-upload.controller';
import { BaseAPIModule } from '@app/common';
import { DbModule } from '@app/db';
import { S3Module } from '@app/aws/s3';
import { UploadTfrDocumentUseCase } from './commands/upload-tfr-document/upload-tfr-document.usecase';
import { GetTfrDocumentsUseCase } from './queries/get-tfr-documents/get-tfr-documents.usecase';
import { GenerateUploadUrlUseCase } from './commands/generate-upload-url/generate-upload-url.usecase';

@Module({
  imports: [BaseAPIModule, DbModule, S3Module],
  controllers: [DocumentUploadController],
  providers: [
    UploadTfrDocumentUseCase,
    GetTfrDocumentsUseCase,
    GenerateUploadUrlUseCase,
  ],
})
export class DocumentUploadModule {}
