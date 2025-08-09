/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: Controller to manage OCR processing operations for Girl Scouts POC
 * Module: Girl Scouts POC Backend
 */

import {
  applyDecorators,
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseIntPipe,
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
} from '@nestjs/swagger';
import { ExtractTfrDataUseCase } from './commands/extract-tfr-data/extract-tfr-data.usecase';
import { ValidateTfrDataUseCase } from './commands/validate-tfr-data/validate-tfr-data.usecase';
import { GetProcessingStatusUseCase } from './queries/get-processing-status/get-processing-status.usecase';
import { GetExtractionResultsUseCase } from './queries/get-extraction-results/get-extraction-results.usecase';
import { ExtractTfrDataCommand } from './commands/extract-tfr-data/extract-tfr-data.command';
import { ValidateTfrDataCommand } from './commands/validate-tfr-data/validate-tfr-data.command';
import { GetProcessingStatusQuery } from './queries/get-processing-status/get-processing-status.query';
import { GetExtractionResultsQuery } from './queries/get-extraction-results/get-extraction-results.query';

@Controller('ocr-processor')
@ApiTags('OCR Processing')
@UseGuards(FeaturesGuard)
export class OcrProcessorController {
  constructor(
    private readonly extractTfrDataUseCase: ExtractTfrDataUseCase,
    private readonly validateTfrDataUseCase: ValidateTfrDataUseCase,
    private readonly getProcessingStatusUseCase: GetProcessingStatusUseCase,
    private readonly getExtractionResultsUseCase: GetExtractionResultsUseCase,
  ) {}

  @Post('extract-tfr-data')
  @CheckFeatures([RESOURCES.DOCUMENTS, ACTIONS.UPDATE])
  @ExtractTfrDataAPIDocs()
  async extractTfrData(
    @Body() command: ExtractTfrDataCommand,
    @Req() request: any,
  ) {
    return this.extractTfrDataUseCase.execute(command);
  }

  @Post('validate-tfr-data')
  @CheckFeatures([RESOURCES.DOCUMENTS, ACTIONS.UPDATE])
  @ValidateTfrDataAPIDocs()
  async validateTfrData(
    @Body() command: ValidateTfrDataCommand,
    @Req() request: any,
  ) {
    return this.validateTfrDataUseCase.execute(command);
  }

  @Get('processing-status/:documentId')
  @CheckFeatures([RESOURCES.DOCUMENTS, ACTIONS.GET])
  @GetProcessingStatusAPIDocs()
  async getProcessingStatus(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Req() request: any,
  ) {
    const query = new GetProcessingStatusQuery(documentId);
    return this.getProcessingStatusUseCase.execute(query);
  }

  @Get('extraction-results/:documentId')
  @CheckFeatures([RESOURCES.DOCUMENTS, ACTIONS.GET])
  @GetExtractionResultsAPIDocs()
  async getExtractionResults(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Req() request: any,
  ) {
    const query = new GetExtractionResultsQuery(documentId);
    return this.getExtractionResultsUseCase.execute(query);
  }
}

// API Documentation Decorators (following user pattern)
function ExtractTfrDataAPIDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Extract data from TFR document using OCR' }),
    ApiResponse(createSwaggerResponse('OCR extraction initiated successfully', 200)),
  );
}

function ValidateTfrDataAPIDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Validate extracted TFR data' }),
    ApiResponse(createSwaggerResponse('Data validation completed', 200)),
  );
}

function GetProcessingStatusAPIDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get OCR processing status for a document' }),
    ApiResponse(createSwaggerResponse('Processing status retrieved', 200)),
  );
}

function GetExtractionResultsAPIDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get OCR extraction results for a document' }),
    ApiResponse(createSwaggerResponse('Extraction results retrieved', 200)),
  );
}
