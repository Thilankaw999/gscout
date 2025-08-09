/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: OCR Processor API Module
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import { Module } from '@nestjs/common';
import { OcrProcessorController } from './ocr-processor.controller';
import { BaseAPIModule, CommonModule } from '@app/common';
import { DbModule } from '@app/db';
import { UserContextModule } from '@app/user-context';
import { S3Module } from '@app/aws/s3';

// Use Cases - Commands
import { ExtractTfrDataUseCase } from './commands/extract-tfr-data/extract-tfr-data.usecase';
import { ValidateTfrDataUseCase } from './commands/validate-tfr-data/validate-tfr-data.usecase';

// Use Cases - Queries
import { GetProcessingStatusUseCase } from './queries/get-processing-status/get-processing-status.usecase';
import { GetExtractionResultsUseCase } from './queries/get-extraction-results/get-extraction-results.usecase';

// Services
import { TextractService } from './services/textract.service';
import { TfrParserService } from './services/tfr-parser.service';
import { DataValidationService } from './services/data-validation.service';

@Module({
  imports: [BaseAPIModule, CommonModule, DbModule, UserContextModule, S3Module],
  controllers: [OcrProcessorController],
  providers: [
    // Commands
    ExtractTfrDataUseCase,
    ValidateTfrDataUseCase,
    
    // Queries
    GetProcessingStatusUseCase,
    GetExtractionResultsUseCase,
    
    // Services
    TextractService,
    TfrParserService,
    DataValidationService,
  ],
})
export class OcrProcessorApiModule {}
