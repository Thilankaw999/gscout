/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: Document Upload API Module - Following User App Pattern
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import { Module } from '@nestjs/common';
import { DocumentUploadController } from './document-upload.controller';
import { BaseAPIModule, CommonModule } from '@app/common';
import { DbModule } from '@app/db';
import { UserContextModule } from '@app/user-context';
import { S3Module } from '@app/aws/s3';

// Use Cases - Commands
import { UploadTfrDocumentUseCase } from './commands/upload-tfr-document/upload-tfr-document.usecase';
import { GenerateUploadUrlUseCase } from './commands/generate-upload-url/generate-upload-url.usecase';

// Use Cases - Queries
import { GetTfrDocumentsUseCase } from './queries/get-tfr-documents/get-tfr-documents.usecase';
import { GetDocumentStatusUseCase } from './queries/get-document-status/get-document-status.usecase';

// Services
import { TfrDocumentService } from './services/tfr-document.service';
import { DocumentValidationService } from './services/document-validation.service';

@Module({
  imports: [BaseAPIModule, CommonModule, DbModule, UserContextModule, S3Module],
  controllers: [DocumentUploadController],
  providers: [
    // Commands
    UploadTfrDocumentUseCase,
    GenerateUploadUrlUseCase,
    
    // Queries
    GetTfrDocumentsUseCase,
    GetDocumentStatusUseCase,
    
    // Services
    TfrDocumentService,
    DocumentValidationService,
  ],
})
export class DocumentUploadApiModule {}
