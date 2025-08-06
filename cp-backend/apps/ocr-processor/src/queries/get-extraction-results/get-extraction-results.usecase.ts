/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: Get Extraction Results Use Case
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import { Injectable } from '@nestjs/common';
import { UseCase } from '@app/common';
import { DatabaseService } from '@app/db';
import { eq } from 'drizzle-orm';
import { tfrDocuments, extractedFinancialData, bankStatementValidations } from '@app/db/schema';
import { GetExtractionResultsQuery } from './get-extraction-results.query';
import { ExtractionResultsDto } from '../../dto/ocr-processing.dto';

@Injectable()
export class GetExtractionResultsUseCase extends UseCase<GetExtractionResultsQuery, ExtractionResultsDto> {
  constructor(private readonly db: DatabaseService) {
    super();
  }

  async execute(query: GetExtractionResultsQuery): Promise<ExtractionResultsDto> {
    // Get document info
    const [document] = await this.db.db
      .select({
        id: tfrDocuments.id,
        troopId: tfrDocuments.troopId,
        reportPeriod: tfrDocuments.reportPeriod,
        status: tfrDocuments.status,
        validationResults: tfrDocuments.validationResults,
      })
      .from(tfrDocuments)
      .where(eq(tfrDocuments.id, query.documentId))
      .limit(1);

    if (!document) {
      throw new Error(`Document with ID ${query.documentId} not found`);
    }

    // Get extracted financial data
    const [financialData] = await this.db.db
      .select()
      .from(extractedFinancialData)
      .where(eq(extractedFinancialData.documentId, query.documentId))
      .limit(1);

    if (!financialData) {
      throw new Error(`No extracted financial data found for document ${query.documentId}`);
    }

    // Get bank validation if exists
    const [bankValidation] = await this.db.db
      .select()
      .from(bankStatementValidations)
      .where(eq(bankStatementValidations.tfrDocumentId, query.documentId))
      .limit(1);

    return {
      documentId: document.id,
      troopId: document.troopId,
      reportPeriod: document.reportPeriod,
      financialData: {
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
      },
      validation: {
        isValidated: financialData.isValidated,
        validationErrors: financialData.validationErrors || [],
        validationWarnings: financialData.validationWarnings || [],
      },
      confidence: {
        overall: parseFloat(financialData.overallConfidence || '0'),
        fields: financialData.fieldConfidences || {},
      },
      bankValidation: bankValidation ? {
        balanceMatches: bankValidation.balanceMatches,
        extractedBankBalance: parseFloat(bankValidation.extractedBankBalance || '0'),
        balanceDifference: parseFloat(bankValidation.balanceDifference || '0'),
        validationNotes: bankValidation.validationNotes,
      } : undefined,
    };
  }
}
