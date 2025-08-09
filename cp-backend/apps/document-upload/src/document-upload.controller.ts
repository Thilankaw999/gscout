/**
 * Author: AI Assistant  
 * Created on: 05-08-2025
 * Description: Controller to manage TFR document upload operations for Girl Scouts POC
 * Module: Girl Scouts POC Backend
 */

import {
  applyDecorators,
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ACTIONS,
  CheckFeatures,
  FeaturesGuard,
  RESOURCES,
} from '@app/permissions';
import { createSwaggerResponse } from '@app/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { UploadTfrDocumentUseCase } from './commands/upload-tfr-document/upload-tfr-document.usecase';
import { GetTfrDocumentsUseCase } from './queries/get-tfr-documents/get-tfr-documents.usecase';
import { GenerateUploadUrlUseCase } from './commands/generate-upload-url/generate-upload-url.usecase';
import { UploadTfrDocumentCommand } from './commands/upload-tfr-document/upload-tfr-document.command';
import { GetTfrDocumentsQuery } from './queries/get-tfr-documents/get-tfr-documents.query';
import { GenerateUploadUrlCommand } from './commands/generate-upload-url/generate-upload-url.command';

@Controller('document-upload')
@ApiTags('Document Upload')
@UseGuards(FeaturesGuard)
export class DocumentUploadController {
  constructor(
    private readonly uploadTfrDocumentUseCase: UploadTfrDocumentUseCase,
    private readonly getTfrDocumentsUseCase: GetTfrDocumentsUseCase,
    private readonly generateUploadUrlUseCase: GenerateUploadUrlUseCase,
  ) {}

  @Get('upload-url')
  @CheckFeatures([RESOURCES.DOCUMENTS, ACTIONS.CREATE])
  @GenerateUploadUrlAPIDocs()
  async generateUploadUrl(
    @Query('fileName') fileName: string,
    @Query('troopId') troopId: string,
    @Query('reportPeriod') reportPeriod: string,
    @Req() request: any,
  ) {
    const command = new GenerateUploadUrlCommand(fileName, troopId, reportPeriod);
    return this.generateUploadUrlUseCase.execute(command);
  }

  @Post('upload-tfr')
  @CheckFeatures([RESOURCES.DOCUMENTS, ACTIONS.CREATE])
  @UploadTfrDocumentAPIDocs()
  async uploadTfrDocument(
    @Body() command: UploadTfrDocumentCommand,
    @Req() request: any,
  ) {
    return this.uploadTfrDocumentUseCase.execute(command);
  }

  @Get('tfr-documents')
  @CheckFeatures([RESOURCES.DOCUMENTS, ACTIONS.GET])
  @GetTfrDocumentsAPIDocs()
  async getTfrDocuments(
    @Query('troopId') troopId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Req() request: any,
  ) {
    const query = new GetTfrDocumentsQuery(troopId, status, limit);
    return this.getTfrDocumentsUseCase.execute(query);
  }
}

// API Documentation Decorators (following user pattern)
function GenerateUploadUrlAPIDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Generate presigned URL for TFR document upload' }),
    ApiQuery({ name: 'fileName', description: 'Original filename' }),
    ApiQuery({ name: 'troopId', description: 'Troop ID' }),
    ApiQuery({ name: 'reportPeriod', description: 'Report period (YYYY-MM-DD)' }),
    ApiResponse(createSwaggerResponse('Presigned URL generated successfully', 200)),
  );
}

function UploadTfrDocumentAPIDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Record TFR document upload and trigger processing' }),
    ApiResponse(createSwaggerResponse('Document uploaded and processing initiated', 201)),
  );
}

function GetTfrDocumentsAPIDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all TFR documents with optional filtering' }),
    ApiQuery({ name: 'troopId', required: false, description: 'Filter by troop ID' }),
    ApiQuery({ name: 'status', required: false, description: 'Filter by document status' }),
    ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limit number of results' }),
    ApiResponse(createSwaggerResponse('TFR documents retrieved successfully', 200)),
  );
}
  @ApiQuery({ name: 'troopId', required: false, description: 'Filter by troop ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by processing status' })
  @ApiQuery({ name: 'reportYear', required: false, description: 'Filter by report year' })
  @ApiResponse({ status: 200, description: 'TFR documents retrieved' })
  async getTfrDocuments(
    @Query('troopId') troopId?: string,
    @Query('status') status?: string,
    @Query('reportYear') reportYear?: number,
  ) {
    const query = new GetTfrDocumentsQuery(troopId, status, reportYear);
    return this.getTfrDocumentsUseCase.execute(query);
  }

  @Get('tfr-documents/:troopId')
  @ApiOperation({ summary: 'Get TFR documents for a specific troop' })
  @ApiResponse({ status: 200, description: 'Troop TFR documents retrieved' })
  async getTroopDocuments(@Param('troopId') troopId: string) {
    const query = new GetTfrDocumentsQuery(troopId);
    return this.getTfrDocumentsUseCase.execute(query);
  }
}
