/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: TFR Parser Service
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import { Injectable } from '@nestjs/common';
import { Logger } from '@aws-lambda-powertools/logger';

interface ParsedTfrData {
  beginningBalance: number | null;
  totalIncome: number | null;
  totalExpenses: number | null;
  endingBalance: number | null;
  cookieIncome: number | null;
  fallProductIncome: number | null;
  otherIncome: number | null;
  badgeExpenses: number | null;
  meetingExpenses: number | null;
  tripExpenses: number | null;
  otherExpenses: number | null;
  confidence: number;
  fieldConfidences: Record<string, number>;
}

@Injectable()
export class TfrParserService {
  private readonly logger = new Logger({ serviceName: 'TfrParserService' });

  /**
   * Parse TFR-specific data from Textract output
   */
  async parseTfrData(textractResult: any): Promise<ParsedTfrData> {
    this.logger.info('Starting TFR data parsing', {
      blockCount: textractResult.Blocks?.length || 0,
    });

    const blocks = textractResult.Blocks || [];
    const extractedData: ParsedTfrData = {
      beginningBalance: null,
      totalIncome: null,
      totalExpenses: null,
      endingBalance: null,
      cookieIncome: null,
      fallProductIncome: null,
      otherIncome: null,
      badgeExpenses: null,
      meetingExpenses: null,
      tripExpenses: null,
      otherExpenses: null,
      confidence: 0,
      fieldConfidences: {},
    };

    // Parse form fields and tables
    await this.parseFormFields(blocks, extractedData);
    await this.parseTableData(blocks, extractedData);
    
    // Calculate overall confidence
    extractedData.confidence = this.calculateOverallConfidence(blocks);

    this.logger.info('TFR data parsing completed', {
      extractedFields: Object.keys(extractedData).filter(key => 
        extractedData[key] !== null && !['confidence', 'fieldConfidences'].includes(key)
      ).length,
      overallConfidence: extractedData.confidence,
    });

    return extractedData;
  }

  private async parseFormFields(blocks: any[], extractedData: ParsedTfrData): Promise<void> {
    // Define field mappings for TFR forms
    const fieldMappings = {
      // Balance fields
      'beginning balance': 'beginningBalance',
      'starting balance': 'beginningBalance',
      'balance forward': 'beginningBalance',
      'total income': 'totalIncome',
      'total receipts': 'totalIncome',
      'gross income': 'totalIncome',
      'total expenses': 'totalExpenses',
      'total expenditures': 'totalExpenses',
      'total costs': 'totalExpenses',
      'ending balance': 'endingBalance',
      'final balance': 'endingBalance',
      'closing balance': 'endingBalance',
      
      // Income breakdown
      'cookie income': 'cookieIncome',
      'cookie sales': 'cookieIncome',
      'cookie program': 'cookieIncome',
      'fall product income': 'fallProductIncome',
      'fall products': 'fallProductIncome',
      'nuts and candy': 'fallProductIncome',
      'other income': 'otherIncome',
      'miscellaneous income': 'otherIncome',
      'donations': 'otherIncome',
      
      // Expense breakdown
      'badge expenses': 'badgeExpenses',
      'badges': 'badgeExpenses',
      'patch expenses': 'badgeExpenses',
      'meeting expenses': 'meetingExpenses',
      'meeting costs': 'meetingExpenses',
      'supplies': 'meetingExpenses',
      'trip expenses': 'tripExpenses',
      'outing expenses': 'tripExpenses',
      'field trip': 'tripExpenses',
      'other expenses': 'otherExpenses',
      'miscellaneous expenses': 'otherExpenses',
    };

    blocks.forEach(block => {
      if (block.BlockType === 'KEY_VALUE_SET' && block.EntityTypes?.includes('KEY')) {
        const keyText = this.getBlockText(block, blocks).toLowerCase().trim();
        const fieldKey = this.findMatchingField(keyText, fieldMappings);
        
        if (fieldKey) {
          const valueBlock = this.findValueBlock(block, blocks);
          if (valueBlock) {
            const valueText = this.getBlockText(valueBlock, blocks);
            const amount = this.parseAmount(valueText);
            
            if (amount !== null) {
              extractedData[fieldKey] = amount;
              extractedData.fieldConfidences[fieldKey] = block.Confidence || 0;
              
              this.logger.debug('Extracted field', {
                field: fieldKey,
                keyText,
                valueText,
                amount,
                confidence: block.Confidence,
              });
            }
          }
        }
      }
    });
  }

  private async parseTableData(blocks: any[], extractedData: ParsedTfrData): Promise<void> {
    // Parse table-based TFR data
    const tables = blocks.filter(block => block.BlockType === 'TABLE');
    
    for (const table of tables) {
      const cells = this.extractTableCells(table, blocks);
      
      // Look for financial data in table format
      this.parseFinancialTable(cells, extractedData);
    }
  }

  private extractTableCells(table: any, blocks: any[]): any[] {
    const cells = [];
    
    if (table.Relationships) {
      const cellRelation = table.Relationships.find(r => r.Type === 'CHILD');
      if (cellRelation) {
        cellRelation.Ids.forEach(cellId => {
          const cell = blocks.find(b => b.Id === cellId && b.BlockType === 'CELL');
          if (cell) {
            cells.push({
              ...cell,
              Text: this.getBlockText(cell, blocks),
            });
          }
        });
      }
    }
    
    return cells;
  }

  private parseFinancialTable(cells: any[], extractedData: ParsedTfrData): void {
    // This would implement table-specific parsing logic
    // Looking for financial data organized in table format
    
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const cellText = cell.Text?.toLowerCase() || '';
      
      // Look for labels in one cell and values in adjacent cells
      if (cellText.includes('beginning') && cellText.includes('balance')) {
        const valueCell = cells.find(c => 
          c.RowIndex === cell.RowIndex && 
          c.ColumnIndex === cell.ColumnIndex + 1
        );
        if (valueCell) {
          const amount = this.parseAmount(valueCell.Text);
          if (amount !== null) {
            extractedData.beginningBalance = amount;
            extractedData.fieldConfidences.beginningBalance = cell.Confidence || 0;
          }
        }
      }
      
      // Similar logic for other fields...
    }
  }

  private findMatchingField(keyText: string, fieldMappings: Record<string, string>): string | null {
    // Find the best matching field for the given key text
    for (const [pattern, fieldName] of Object.entries(fieldMappings)) {
      if (keyText.includes(pattern)) {
        return fieldName;
      }
    }
    
    // Try partial matches
    const words = keyText.split(/\s+/);
    for (const [pattern, fieldName] of Object.entries(fieldMappings)) {
      const patternWords = pattern.split(/\s+/);
      if (patternWords.every(word => words.includes(word))) {
        return fieldName;
      }
    }
    
    return null;
  }

  private getBlockText(block: any, blocks: any[]): string {
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
    
    // Clean the text: remove common currency symbols, commas, parentheses
    let cleanText = text.replace(/[$,()]/g, '').trim();
    
    // Handle negative amounts (parentheses or minus sign)
    let isNegative = false;
    if (text.includes('(') && text.includes(')')) {
      isNegative = true;
    }
    if (cleanText.startsWith('-')) {
      isNegative = true;
      cleanText = cleanText.substring(1);
    }
    
    // Parse the number
    const amount = parseFloat(cleanText);
    if (isNaN(amount)) return null;
    
    return isNegative ? -amount : amount;
  }

  private calculateOverallConfidence(blocks: any[]): number {
    const confidenceScores = blocks
      .filter(block => block.Confidence && block.BlockType === 'WORD')
      .map(block => block.Confidence);
    
    if (confidenceScores.length === 0) return 0;
    
    return confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
  }
}
