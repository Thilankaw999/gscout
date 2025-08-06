/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: OCR Processor Controller
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import { Controller, Post, Get, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExtractTfrDataUseCase } from './commands/extract-tfr-data/extract-tfr-data.usecase';
import { ValidateTfrDataUseCase } from './commands/validate-tfr-data/validate-tfr-data.usecase';
import { GetProcessingStatusUseCase } from './queries/get-processing-status/get-processing-status.usecase';
import { GetExtractionResultsUseCase } from './queries/get-extraction-results/get-extraction-results.usecase';
import { ExtractTfrDataCommand } from './commands/extract-tfr-data/extract-tfr-data.command';
import { ValidateTfrDataCommand } from './commands/validate-tfr-data/validate-tfr-data.command';
import { GetProcessingStatusQuery } from './queries/get-processing-status/get-processing-status.query';
import { GetExtractionResultsQuery } from './queries/get-extraction-results/get-extraction-results.query';

@ApiTags('OCR Processing')
@Controller()
export class OcrProcessorController {
  constructor(
    private readonly extractTfrDataUseCase: ExtractTfrDataUseCase,
    private readonly validateTfrDataUseCase: ValidateTfrDataUseCase,
    private readonly getProcessingStatusUseCase: GetProcessingStatusUseCase,
    private readonly getExtractionResultsUseCase: GetExtractionResultsUseCase,
  ) {}

  @Post('extract-tfr-data')
  @ApiOperation({ summary: 'Extract data from TFR document using OCR' })
  @ApiResponse({ status: 200, description: 'OCR extraction initiated successfully' })
  async extractTfrData(@Body() command: ExtractTfrDataCommand) {
    return this.extractTfrDataUseCase.execute(command);
  }

  @Post('validate-tfr-data')
  @ApiOperation({ summary: 'Validate extracted TFR data' })
  @ApiResponse({ status: 200, description: 'Data validation completed' })
  async validateTfrData(@Body() command: ValidateTfrDataCommand) {
    return this.validateTfrDataUseCase.execute(command);
  }

  @Get('processing-status/:documentId')
  @ApiOperation({ summary: 'Get OCR processing status for a document' })
  @ApiResponse({ status: 200, description: 'Processing status retrieved' })
  async getProcessingStatus(@Param('documentId', ParseIntPipe) documentId: number) {
    const query = new GetProcessingStatusQuery(documentId);
    return this.getProcessingStatusUseCase.execute(query);
  }

  @Get('extraction-results/:documentId')
  @ApiOperation({ summary: 'Get OCR extraction results for a document' })
  @ApiResponse({ status: 200, description: 'Extraction results retrieved' })
  async getExtractionResults(@Param('documentId', ParseIntPipe) documentId: number) {
    const query = new GetExtractionResultsQuery(documentId);
    return this.getExtractionResultsUseCase.execute(query);
  }
}
