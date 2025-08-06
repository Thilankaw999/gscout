/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: Extract TFR Data Use Case
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import { Injectable } from '@nestjs/common';
import { UseCase } from '@app/common';
import { DatabaseService } from '@app/db';
import { Logger } from '@aws-lambda-powertools/logger';
import { eq } from 'drizzle-orm';
import { tfrDocuments, extractedFinancialData, processingAuditLog } from '@app/db/schema';
import { ExtractTfrDataCommand } from './extract-tfr-data.command';
import { TextractService } from '../../services/textract.service';
import { TfrParserService } from '../../services/tfr-parser.service';
import { DataValidationService } from '../../services/data-validation.service';
import { OcrResultDto } from '../../dto/ocr-processing.dto';

@Injectable()
export class ExtractTfrDataUseCase extends UseCase<ExtractTfrDataCommand, OcrResultDto> {
  private readonly logger = new Logger({ serviceName: 'ExtractTfrDataUseCase' });

  constructor(
    private readonly db: DatabaseService,
    private readonly textractService: TextractService,
    private readonly tfrParserService: TfrParserService,
    private readonly dataValidationService: DataValidationService,
  ) {
    super();
  }

  async execute(command: ExtractTfrDataCommand): Promise<OcrResultDto> {
    const startTime = Date.now();
    
    this.logger.info('Starting TFR OCR extraction', {
      documentId: command.documentId,
      s3Key: command.s3Key,
      forceReprocess: command.forceReprocess,
    });

    try {
      // Get document record
      const [document] = await this.db.db
        .select()
        .from(tfrDocuments)
        .where(eq(tfrDocuments.id, command.documentId))
        .limit(1);

      if (!document) {
        throw new Error(`Document with ID ${command.documentId} not found`);
      }

      // Check if already processed and not forcing reprocess
      if (!command.forceReprocess && document.status === 'completed') {
        this.logger.info('Document already processed, skipping', { documentId: command.documentId });
        return this.buildResultFromExistingData(document);
      }

      // Log processing start
      await this.logProcessingStep(command.documentId, 'ocr_extraction', 'started', {
        s3Key: command.s3Key,
        forceReprocess: command.forceReprocess,
      });

      // Update status to processing
      await this.db.db
        .update(tfrDocuments)
        .set({
          status: 'processing',
          processingStartedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tfrDocuments.id, command.documentId));

      // Call AWS Textract
      const textractResult = await this.textractService.analyzeDocument({
        bucket: command.s3Bucket,
        key: command.s3Key,
      });

      // Parse TFR-specific data
      const parsedData = await this.tfrParserService.parseTfrData(textractResult);

      // Validate extracted data
      const validationResult = await this.dataValidationService.validateExtractedData(
        parsedData,
        document.troopId,
      );

      const processingTime = Date.now() - startTime;

      // Update document with OCR results
      await this.db.db
        .update(tfrDocuments)
        .set({
          status: 'ocr_completed',
          ocrResults: {
            confidence: parsedData.confidence,
            rawTextractOutput: textractResult,
            extractedFields: parsedData,
            processingTime,
          },
          validationResults: {
            isValid: validationResult.isValid,
            errors: validationResult.errors,
            warnings: validationResult.warnings,
            validatedAt: new Date().toISOString(),
            validatedBy: 'system',
          },
          processingCompletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(tfrDocuments.id, command.documentId));

      // Save extracted financial data
      await this.saveExtractedFinancialData(command.documentId, document, parsedData, validationResult);

      // Log completion
      await this.logProcessingStep(command.documentId, 'ocr_extraction', 'completed', {
        confidence: parsedData.confidence,
        processingTime,
        validationResult: validationResult.isValid,
      });

      this.logger.info('TFR OCR extraction completed successfully', {
        documentId: command.documentId,
        processingTime,
        confidence: parsedData.confidence,
        isValid: validationResult.isValid,
      });

      return {
        documentId: command.documentId,
        status: 'ocr_completed',
        extractedData: {
          beginningBalance: parsedData.beginningBalance,
          totalIncome: parsedData.totalIncome,
          totalExpenses: parsedData.totalExpenses,
          endingBalance: parsedData.endingBalance,
          cookieIncome: parsedData.cookieIncome,
          fallProductIncome: parsedData.fallProductIncome,
          otherIncome: parsedData.otherIncome,
          badgeExpenses: parsedData.badgeExpenses,
          meetingExpenses: parsedData.meetingExpenses,
          tripExpenses: parsedData.tripExpenses,
          otherExpenses: parsedData.otherExpenses,
          confidence: parsedData.confidence,
        },
        validation: {
          isValid: validationResult.isValid,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        },
        processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error('TFR OCR extraction failed', {
        error: error.message,
        documentId: command.documentId,
        processingTime,
      });

      // Update document status to failed
      await this.db.db
        .update(tfrDocuments)
        .set({
          status: 'failed',
          errorMessage: error.message,
          retryCount: document.retryCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(tfrDocuments.id, command.documentId));

      // Log failure
      await this.logProcessingStep(command.documentId, 'ocr_extraction', 'failed', {
        error: error.message,
        processingTime,
      });

      throw error;
    }
  }

  private async saveExtractedFinancialData(
    documentId: number,
    document: any,
    parsedData: any,
    validationResult: any,
  ): Promise<void> {
    // Check if financial data already exists
    const [existingData] = await this.db.db
      .select()
      .from(extractedFinancialData)
      .where(eq(extractedFinancialData.documentId, documentId))
      .limit(1);

    const financialDataPayload = {
      documentId,
      troopId: document.troopId,
      reportPeriod: document.reportPeriod,
      reportYear: document.reportYear,
      beginningBalance: parsedData.beginningBalance?.toString(),
      totalIncome: parsedData.totalIncome?.toString(),
      totalExpenses: parsedData.totalExpenses?.toString(),
      endingBalance: parsedData.endingBalance?.toString(),
      cookieIncome: parsedData.cookieIncome?.toString(),
      fallProductIncome: parsedData.fallProductIncome?.toString(),
      otherIncome: parsedData.otherIncome?.toString(),
      badgeExpenses: parsedData.badgeExpenses?.toString(),
      meetingExpenses: parsedData.meetingExpenses?.toString(),
      tripExpenses: parsedData.tripExpenses?.toString(),
      otherExpenses: parsedData.otherExpenses?.toString(),
      isValidated: validationResult.isValid ? 'valid' : 'invalid',
      validationErrors: validationResult.errors,
      validationWarnings: validationResult.warnings,
      overallConfidence: parsedData.confidence?.toString(),
      fieldConfidences: parsedData.fieldConfidences || {},
      updatedAt: new Date(),
    };

    if (existingData) {
      // Update existing record
      await this.db.db
        .update(extractedFinancialData)
        .set(financialDataPayload)
        .where(eq(extractedFinancialData.id, existingData.id));
    } else {
      // Insert new record
      await this.db.db
        .insert(extractedFinancialData)
        .values({
          ...financialDataPayload,
          createdAt: new Date(),
        });
    }
  }

  private async logProcessingStep(
    documentId: number,
    stepName: string,
    stepStatus: 'started' | 'completed' | 'failed',
    stepDetails: Record<string, any>,
  ): Promise<void> {
    await this.db.db.insert(processingAuditLog).values({
      documentId,
      stepName,
      stepStatus,
      stepDetails,
      processingTime: stepDetails.processingTime,
      errorMessage: stepDetails.error,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  private async buildResultFromExistingData(document: any): Promise<OcrResultDto> {
    const [financialData] = await this.db.db
      .select()
      .from(extractedFinancialData)
      .where(eq(extractedFinancialData.documentId, document.id))
      .limit(1);

    return {
      documentId: document.id,
      status: document.status,
      extractedData: financialData ? {
        beginningBalance: parseFloat(financialData.beginningBalance || '0'),
        totalIncome: parseFloat(financialData.totalIncome || '0'),
        totalExpenses: parseFloat(financialData.totalExpenses || '0'),
        endingBalance: parseFloat(financialData.endingBalance || '0'),
        cookieIncome: parseFloat(financialData.cookieIncome || '0'),
        fallProductIncome: parseFloat(financialData.fallProductIncome || '0'),
        otherIncome: parseFloat(financialData.otherIncome || '0'),
        badgeExpenses: parseFloat(financialData.badgeExpenses || '0'),
        meetingExpenses: parseFloat(financialData.meetingExpenses || '0'),
        tripExpenses: parseFloat(financialData.tripExpenses || '0'),
        otherExpenses: parseFloat(financialData.otherExpenses || '0'),
        confidence: parseFloat(financialData.overallConfidence || '0'),
      } : undefined,
      validation: document.validationResults,
    };
  }
}
