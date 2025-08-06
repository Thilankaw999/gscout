/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: Document Upload Controller
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UploadTfrDocumentUseCase } from './commands/upload-tfr-document/upload-tfr-document.usecase';
import { GetTfrDocumentsUseCase } from './queries/get-tfr-documents/get-tfr-documents.usecase';
import { GenerateUploadUrlUseCase } from './commands/generate-upload-url/generate-upload-url.usecase';
import { UploadTfrDocumentCommand } from './commands/upload-tfr-document/upload-tfr-document.command';
import { GetTfrDocumentsQuery } from './queries/get-tfr-documents/get-tfr-documents.query';
import { GenerateUploadUrlCommand } from './commands/generate-upload-url/generate-upload-url.command';

@ApiTags('Document Upload')
@Controller()
export class DocumentUploadController {
  constructor(
    private readonly uploadTfrDocumentUseCase: UploadTfrDocumentUseCase,
    private readonly getTfrDocumentsUseCase: GetTfrDocumentsUseCase,
    private readonly generateUploadUrlUseCase: GenerateUploadUrlUseCase,
  ) {}

  @Get('upload-url')
  @ApiOperation({ summary: 'Generate presigned URL for TFR document upload' })
  @ApiQuery({ name: 'fileName', description: 'Original filename' })
  @ApiQuery({ name: 'troopId', description: 'Troop ID' })
  @ApiQuery({ name: 'reportPeriod', description: 'Report period (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Presigned URL generated successfully' })
  async generateUploadUrl(
    @Query('fileName') fileName: string,
    @Query('troopId') troopId: string,
    @Query('reportPeriod') reportPeriod: string,
  ) {
    const command = new GenerateUploadUrlCommand(fileName, troopId, reportPeriod);
    return this.generateUploadUrlUseCase.execute(command);
  }

  @Post('upload-tfr')
  @ApiOperation({ summary: 'Record TFR document upload and trigger processing' })
  @ApiResponse({ status: 201, description: 'Document uploaded and processing initiated' })
  async uploadTfrDocument(@Body() command: UploadTfrDocumentCommand) {
    return this.uploadTfrDocumentUseCase.execute(command);
  }

  @Get('tfr-documents')
  @ApiOperation({ summary: 'Get all TFR documents with optional filtering' })
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
