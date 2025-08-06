/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: Validate TFR Data Use Case
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import { Injectable } from '@nestjs/common';
import { UseCase } from '@app/common';
import { DatabaseService } from '@app/db';
import { Logger } from '@aws-lambda-powertools/logger';
import { eq } from 'drizzle-orm';
import { tfrDocuments, extractedFinancialData, bankStatementValidations } from '@app/db/schema';
import { ValidateTfrDataCommand } from './validate-tfr-data.command';
import { DataValidationService } from '../../services/data-validation.service';
import { TextractService } from '../../services/textract.service';

@Injectable()
export class ValidateTfrDataUseCase extends UseCase<ValidateTfrDataCommand, any> {
  private readonly logger = new Logger({ serviceName: 'ValidateTfrDataUseCase' });

  constructor(
    private readonly db: DatabaseService,
    private readonly dataValidationService: DataValidationService,
    private readonly textractService: TextractService,
  ) {
    super();
  }

  async execute(command: ValidateTfrDataCommand): Promise<any> {
    this.logger.info('Starting TFR data validation', {
      documentId: command.documentId,
      hasBankStatement: !!command.bankStatementS3Key,
    });

    try {
      // Get document and extracted data
      const [document] = await this.db.db
        .select()
        .from(tfrDocuments)
        .where(eq(tfrDocuments.id, command.documentId))
        .limit(1);

      if (!document) {
        throw new Error(`Document with ID ${command.documentId} not found`);
      }

      const [financialData] = await this.db.db
        .select()
        .from(extractedFinancialData)
        .where(eq(extractedFinancialData.documentId, command.documentId))
        .limit(1);

      if (!financialData) {
        throw new Error(`No extracted financial data found for document ${command.documentId}`);
      }

      // Perform comprehensive validation
      const validationResult = await this.dataValidationService.validateExtractedData(
        {
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
        document.troopId,
      );

      let bankValidationResult = null;

      // Bank statement validation if provided
      if (command.bankStatementS3Key) {
        bankValidationResult = await this.validateAgainstBankStatement(
          command.documentId,
          command.bankStatementS3Key,
          parseFloat(financialData.endingBalance || '0'),
          command.bankName,
        );
      }

      // Update financial data validation status
      await this.db.db
        .update(extractedFinancialData)
        .set({
          isValidated: validationResult.isValid ? 'valid' : 'invalid',
          validationErrors: validationResult.errors,
          validationWarnings: validationResult.warnings,
          updatedAt: new Date(),
        })
        .where(eq(extractedFinancialData.id, financialData.id));

      // Update document status
      const newStatus = validationResult.isValid && (!bankValidationResult || bankValidationResult.balanceMatches === 'yes') 
        ? 'completed' 
        : 'validation_completed';

      await this.db.db
        .update(tfrDocuments)
        .set({
          status: newStatus,
          validationResults: {
            isValid: validationResult.isValid,
            errors: validationResult.errors,
            warnings: validationResult.warnings,
            validatedAt: new Date().toISOString(),
            validatedBy: 'system',
          },
          updatedAt: new Date(),
        })
        .where(eq(tfrDocuments.id, command.documentId));

      this.logger.info('TFR data validation completed', {
        documentId: command.documentId,
        isValid: validationResult.isValid,
        errorCount: validationResult.errors.length,
        warningCount: validationResult.warnings.length,
        bankValidation: bankValidationResult?.balanceMatches,
      });

      return {
        documentId: command.documentId,
        validation: {
          isValid: validationResult.isValid,
          errors: validationResult.errors,
          warnings: validationResult.warnings,
        },
        bankValidation: bankValidationResult,
        status: newStatus,
      };
    } catch (error) {
      this.logger.error('TFR data validation failed', {
        error: error.message,
        documentId: command.documentId,
      });

      // Update document with error
      await this.db.db
        .update(tfrDocuments)
        .set({
          status: 'failed',
          errorMessage: error.message,
          updatedAt: new Date(),
        })
        .where(eq(tfrDocuments.id, command.documentId));

      throw error;
    }
  }

  private async validateAgainstBankStatement(
    documentId: number,
    bankStatementS3Key: string,
    tfrEndingBalance: number,
    bankName?: string,
  ): Promise<any> {
    try {
      // Extract balance from bank statement using Textract
      const bankStatementResult = await this.textractService.analyzeDocument({
        bucket: process.env.TFR_DOCUMENTS_BUCKET!,
        key: bankStatementS3Key,
      });

      // Parse bank statement to extract ending balance
      const extractedBankBalance = await this.extractBankBalance(bankStatementResult, bankName);
      
      const balanceDifference = Math.abs(tfrEndingBalance - extractedBankBalance);
      const balanceMatches = balanceDifference <= 0.01 ? 'yes' : 
                            balanceDifference <= 10.00 ? 'partial' : 'no';

      // Save bank validation results
      await this.db.db.insert(bankStatementValidations).values({
        tfrDocumentId: documentId,
        bankStatementS3Key,
        bankName: bankName || 'Unknown',
        extractedBankBalance: extractedBankBalance.toString(),
        balanceDifference: balanceDifference.toString(),
        balanceMatches,
        validationStatus: 'completed',
        validationNotes: balanceMatches === 'yes' 
          ? 'Balance matches exactly' 
          : `Balance difference: $${balanceDifference.toFixed(2)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        balanceMatches,
        extractedBankBalance,
        balanceDifference,
        tfrBalance: tfrEndingBalance,
      };
    } catch (error) {
      this.logger.error('Bank statement validation failed', {
        error: error.message,
        documentId,
        bankStatementS3Key,
      });

      // Save failed validation
      await this.db.db.insert(bankStatementValidations).values({
        tfrDocumentId: documentId,
        bankStatementS3Key,
        bankName: bankName || 'Unknown',
        balanceMatches: 'unknown',
        validationStatus: 'failed',
        validationNotes: `Validation failed: ${error.message}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        balanceMatches: 'unknown',
        error: error.message,
      };
    }
  }

  private async extractBankBalance(bankStatementResult: any, bankName?: string): Promise<number> {
    // This is a simplified implementation - in reality, you'd need bank-specific parsers
    const blocks = bankStatementResult.Blocks || [];
    
    // Look for common balance indicators
    const balanceKeywords = ['ending balance', 'closing balance', 'final balance', 'balance forward'];
    
    for (const block of blocks) {
      if (block.BlockType === 'KEY_VALUE_SET' && block.EntityTypes?.includes('KEY')) {
        const keyText = this.extractTextFromBlock(block, blocks).toLowerCase();
        
        if (balanceKeywords.some(keyword => keyText.includes(keyword))) {
          const valueBlock = this.findValueBlock(block, blocks);
          if (valueBlock) {
            const valueText = this.extractTextFromBlock(valueBlock, blocks);
            const balance = this.parseAmount(valueText);
            if (balance !== null) {
              return balance;
            }
          }
        }
      }
    }

    throw new Error(`Could not extract balance from bank statement ${bankName ? `for ${bankName}` : ''}`);
  }

  private extractTextFromBlock(block: any, blocks: any[]): string {
    let text = '';
    if (block.Relationships) {
      block.Relationships.forEach(relationship => {
        if (relationship.Type === 'CHILD') {
          relationship.Ids.forEach(childId => {
            const child = blocks.find(b => b.Id === childId);
            if (child && child.BlockType === 'WORD') {
              text += child.Text + ' ';
            }
          });
        }
      });
    }
    return text.trim();
  }

  private findValueBlock(keyBlock: any, blocks: any[]): any {
    if (keyBlock.Relationships) {
      const valueRelation = keyBlock.Relationships.find(r => r.Type === 'VALUE');
      if (valueRelation) {
        return blocks.find(b => b.Id === valueRelation.Ids[0]);
      }
    }
    return null;
  }

  private parseAmount(text: string): number | null {
    if (!text) return null;
    const cleanText = text.replace(/[,$()]/g, '');
    const amount = parseFloat(cleanText);
    return isNaN(amount) ? null : amount;
  }
}
