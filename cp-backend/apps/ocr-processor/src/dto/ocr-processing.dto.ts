/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: OCR Processing DTOs
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import { IsString, IsNotEmpty, IsInt, IsOptional, IsDateString, IsNumber, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExtractTfrDataDto {
  @ApiProperty({ description: 'Document ID to process' })
  @IsInt()
  @IsNotEmpty()
  documentId: number;

  @ApiProperty({ description: 'S3 bucket containing the document' })
  @IsString()
  @IsNotEmpty()
  s3Bucket: string;

  @ApiProperty({ description: 'S3 key of the document' })
  @IsString()
  @IsNotEmpty()
  s3Key: string;

  @ApiPropertyOptional({ description: 'Force reprocessing even if already processed' })
  @IsOptional()
  forceReprocess?: boolean;
}

export class ValidateTfrDataDto {
  @ApiProperty({ description: 'Document ID to validate' })
  @IsInt()
  @IsNotEmpty()
  documentId: number;

  @ApiPropertyOptional({ description: 'S3 key of bank statement for cross-validation' })
  @IsOptional()
  @IsString()
  bankStatementS3Key?: string;

  @ApiPropertyOptional({ description: 'Bank name for validation context' })
  @IsOptional()
  @IsString()
  bankName?: string;
}

export class OcrResultDto {
  @ApiProperty()
  documentId: number;

  @ApiProperty({ enum: ['processing', 'ocr_completed', 'validation_completed', 'completed', 'failed'] })
  status: string;

  @ApiPropertyOptional()
  extractedData?: {
    beginningBalance: number;
    totalIncome: number;
    totalExpenses: number;
    endingBalance: number;
    cookieIncome?: number;
    fallProductIncome?: number;
    otherIncome?: number;
    badgeExpenses?: number;
    meetingExpenses?: number;
    tripExpenses?: number;
    otherExpenses?: number;
    confidence: number;
  };

  @ApiPropertyOptional()
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };

  @ApiPropertyOptional()
  processingTime?: number;
}

export class ProcessingStatusDto {
  @ApiProperty()
  documentId: number;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  troopId: string;

  @ApiProperty({ enum: ['uploaded', 'processing', 'ocr_completed', 'validation_completed', 'completed', 'failed'] })
  status: string;

  @ApiPropertyOptional()
  processingStartedAt?: Date;

  @ApiPropertyOptional()
  processingCompletedAt?: Date;

  @ApiPropertyOptional()
  errorMessage?: string;

  @ApiPropertyOptional()
  retryCount?: number;

  @ApiPropertyOptional()
  overallConfidence?: number;
}

export class ExtractionResultsDto {
  @ApiProperty()
  documentId: number;

  @ApiProperty()
  troopId: string;

  @ApiProperty()
  reportPeriod: Date;

  @ApiProperty()
  financialData: {
    beginningBalance: number;
    totalIncome: number;
    totalExpenses: number;
    endingBalance: number;
    cookieIncome?: number;
    fallProductIncome?: number;
    otherIncome?: number;
    badgeExpenses?: number;
    meetingExpenses?: number;
    tripExpenses?: number;
    otherExpenses?: number;
  };

  @ApiProperty()
  validation: {
    isValidated: string;
    validationErrors: string[];
    validationWarnings: string[];
  };

  @ApiProperty()
  confidence: {
    overall: number;
    fields: Record<string, number>;
  };

  @ApiPropertyOptional()
  bankValidation?: {
    balanceMatches: string;
    extractedBankBalance?: number;
    balanceDifference?: number;
    validationNotes?: string;
  };
}

export class TfrUploadDto {
  @ApiProperty({ description: 'Troop ID' })
  @IsString()
  @IsNotEmpty()
  troopId: string;

  @ApiProperty({ description: 'Troop name' })
  @IsString()
  @IsNotEmpty()
  troopName: string;

  @ApiProperty({ description: 'Report period date (YYYY-MM-DD)' })
  @IsDateString()
  reportPeriod: string;

  @ApiProperty({ description: 'Report year' })
  @IsInt()
  reportYear: number;

  @ApiProperty({ description: 'Original filename' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiPropertyOptional({ description: 'File size in bytes' })
  @IsOptional()
  @IsInt()
  fileSize?: number;

  @ApiPropertyOptional({ description: 'MIME type' })
  @IsOptional()
  @IsString()
  mimeType?: string;
}
