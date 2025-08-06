/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: Data Validation Service
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import { Injectable } from '@nestjs/common';
import { Logger } from '@aws-lambda-powertools/logger';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface FinancialData {
  beginningBalance: number | null;
  totalIncome: number | null;
  totalExpenses: number | null;
  endingBalance: number | null;
  cookieIncome?: number | null;
  fallProductIncome?: number | null;
  otherIncome?: number | null;
  badgeExpenses?: number | null;
  meetingExpenses?: number | null;
  tripExpenses?: number | null;
  otherExpenses?: number | null;
}

@Injectable()
export class DataValidationService {
  private readonly logger = new Logger({ serviceName: 'DataValidationService' });

  /**
   * Validate extracted financial data for completeness and consistency
   */
  async validateExtractedData(data: FinancialData, troopId: string): Promise<ValidationResult> {
    this.logger.info('Starting data validation', { troopId });

    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    this.validateRequiredFields(data, errors);
    
    // Mathematical consistency validation
    this.validateMathematicalConsistency(data, errors, warnings);
    
    // Range validation
    this.validateRanges(data, errors, warnings);
    
    // Business rule validation
    this.validateBusinessRules(data, troopId, errors, warnings);

    const isValid = errors.length === 0;

    this.logger.info('Data validation completed', {
      troopId,
      isValid,
      errorCount: errors.length,
      warningCount: warnings.length,
    });

    return {
      isValid,
      errors,
      warnings,
    };
  }

  private validateRequiredFields(data: FinancialData, errors: string[]): void {
    const requiredFields = [
      { field: 'beginningBalance', name: 'Beginning Balance' },
      { field: 'totalIncome', name: 'Total Income' },
      { field: 'totalExpenses', name: 'Total Expenses' },
      { field: 'endingBalance', name: 'Ending Balance' },
    ];

    requiredFields.forEach(({ field, name }) => {
      const value = data[field];
      if (value === null || value === undefined) {
        errors.push(`${name} is required but was not found or extracted`);
      } else if (isNaN(value)) {
        errors.push(`${name} contains invalid numeric data: ${value}`);
      }
    });
  }

  private validateMathematicalConsistency(
    data: FinancialData, 
    errors: string[], 
    warnings: string[]
  ): void {
    const { beginningBalance, totalIncome, totalExpenses, endingBalance } = data;

    // Skip validation if any required field is missing
    if ([beginningBalance, totalIncome, totalExpenses, endingBalance].some(val => val === null || val === undefined)) {
      return;
    }

    // Basic balance equation: Beginning + Income - Expenses = Ending
    const calculatedEnding = beginningBalance! + totalIncome! - totalExpenses!;
    const difference = Math.abs(calculatedEnding - endingBalance!);

    if (difference > 0.01) { // Allow for small rounding differences
      if (difference > 1.00) {
        errors.push(
          `Balance calculation error: Beginning Balance ($${beginningBalance}) + ` +
          `Total Income ($${totalIncome}) - Total Expenses ($${totalExpenses}) = ` +
          `$${calculatedEnding.toFixed(2)}, but Ending Balance shows $${endingBalance}. ` +
          `Difference: $${difference.toFixed(2)}`
        );
      } else {
        warnings.push(
          `Minor balance calculation difference of $${difference.toFixed(2)}. ` +
          `This may be due to rounding or OCR precision.`
        );
      }
    }

    // Validate income breakdown consistency
    this.validateIncomeBreakdown(data, errors, warnings);
    
    // Validate expense breakdown consistency
    this.validateExpenseBreakdown(data, errors, warnings);
  }

  private validateIncomeBreakdown(
    data: FinancialData, 
    errors: string[], 
    warnings: string[]
  ): void {
    const { totalIncome, cookieIncome, fallProductIncome, otherIncome } = data;

    if (totalIncome === null || totalIncome === undefined) return;

    const incomeComponents = [
      cookieIncome || 0,
      fallProductIncome || 0,
      otherIncome || 0,
    ].filter(val => val !== null);

    if (incomeComponents.length > 0) {
      const calculatedTotal = incomeComponents.reduce((sum, val) => sum + val, 0);
      const difference = Math.abs(calculatedTotal - totalIncome);

      if (difference > 0.01) {
        if (difference > 1.00) {
          errors.push(
            `Income breakdown doesn't match total: Cookie ($${cookieIncome || 0}) + ` +
            `Fall Product ($${fallProductIncome || 0}) + Other ($${otherIncome || 0}) = ` +
            `$${calculatedTotal.toFixed(2)}, but Total Income shows $${totalIncome}. ` +
            `Difference: $${difference.toFixed(2)}`
          );
        } else {
          warnings.push(`Minor income breakdown difference of $${difference.toFixed(2)}`);
        }
      }
    }
  }

  private validateExpenseBreakdown(
    data: FinancialData, 
    errors: string[], 
    warnings: string[]
  ): void {
    const { totalExpenses, badgeExpenses, meetingExpenses, tripExpenses, otherExpenses } = data;

    if (totalExpenses === null || totalExpenses === undefined) return;

    const expenseComponents = [
      badgeExpenses || 0,
      meetingExpenses || 0,
      tripExpenses || 0,
      otherExpenses || 0,
    ].filter(val => val !== null);

    if (expenseComponents.length > 0) {
      const calculatedTotal = expenseComponents.reduce((sum, val) => sum + val, 0);
      const difference = Math.abs(calculatedTotal - totalExpenses);

      if (difference > 0.01) {
        if (difference > 1.00) {
          errors.push(
            `Expense breakdown doesn't match total: Badge ($${badgeExpenses || 0}) + ` +
            `Meeting ($${meetingExpenses || 0}) + Trip ($${tripExpenses || 0}) + ` +
            `Other ($${otherExpenses || 0}) = $${calculatedTotal.toFixed(2)}, ` +
            `but Total Expenses shows $${totalExpenses}. ` +
            `Difference: $${difference.toFixed(2)}`
          );
        } else {
          warnings.push(`Minor expense breakdown difference of $${difference.toFixed(2)}`);
        }
      }
    }
  }

  private validateRanges(data: FinancialData, errors: string[], warnings: string[]): void {
    const MAX_REASONABLE_AMOUNT = 50000; // $50,000 max for troop activities
    const MIN_BALANCE = -1000; // Allow small negative balances but flag large ones

    // Check for unreasonably large amounts
    Object.entries(data).forEach(([field, value]) => {
      if (typeof value === 'number' && value > MAX_REASONABLE_AMOUNT) {
        warnings.push(
          `${this.fieldDisplayName(field)} amount of $${value.toFixed(2)} seems unusually high for a Girl Scout troop`
        );
      }
    });

    // Check for concerning negative balances
    if (data.beginningBalance !== null && data.beginningBalance < MIN_BALANCE) {
      warnings.push(`Beginning balance of $${data.beginningBalance.toFixed(2)} is significantly negative`);
    }
    
    if (data.endingBalance !== null && data.endingBalance < MIN_BALANCE) {
      warnings.push(`Ending balance of $${data.endingBalance.toFixed(2)} is significantly negative`);
    }

    // Check for negative income (which should be positive)
    if (data.totalIncome !== null && data.totalIncome < 0) {
      errors.push(`Total income cannot be negative: $${data.totalIncome.toFixed(2)}`);
    }

    // Check for negative expenses (which should be positive)
    if (data.totalExpenses !== null && data.totalExpenses < 0) {
      errors.push(`Total expenses cannot be negative: $${data.totalExpenses.toFixed(2)}`);
    }
  }

  private validateBusinessRules(
    data: FinancialData, 
    troopId: string, 
    errors: string[], 
    warnings: string[]
  ): void {
    // Cookie income should be a significant portion for most troops
    if (data.totalIncome !== null && data.cookieIncome !== null) {
      const cookiePercentage = (data.cookieIncome / data.totalIncome) * 100;
      
      if (data.totalIncome > 100 && cookiePercentage < 5) {
        warnings.push(
          `Cookie income ($${data.cookieIncome.toFixed(2)}) seems low compared to total income ` +
          `($${data.totalIncome.toFixed(2)}). This may be correct but is unusual.`
        );
      }
    }

    // Large expense amounts should have some breakdown
    if (data.totalExpenses !== null && data.totalExpenses > 500) {
      const hasExpenseBreakdown = [
        data.badgeExpenses,
        data.meetingExpenses,
        data.tripExpenses,
        data.otherExpenses,
      ].some(expense => expense !== null && expense > 0);

      if (!hasExpenseBreakdown) {
        warnings.push(
          `Total expenses of $${data.totalExpenses.toFixed(2)} is significant but no expense ` +
          `breakdown was found. Consider reviewing the expense categories.`
        );
      }
    }

    // Check for zero amounts that might indicate missing data
    const zeroFields = Object.entries(data)
      .filter(([_, value]) => value === 0)
      .map(([field]) => this.fieldDisplayName(field));

    if (zeroFields.length > 0) {
      warnings.push(
        `The following fields have zero values, which may indicate missing data: ${zeroFields.join(', ')}`
      );
    }
  }

  private fieldDisplayName(fieldName: string): string {
    const displayNames: Record<string, string> = {
      beginningBalance: 'Beginning Balance',
      totalIncome: 'Total Income',
      totalExpenses: 'Total Expenses',
      endingBalance: 'Ending Balance',
      cookieIncome: 'Cookie Income',
      fallProductIncome: 'Fall Product Income',
      otherIncome: 'Other Income',
      badgeExpenses: 'Badge Expenses',
      meetingExpenses: 'Meeting Expenses',
      tripExpenses: 'Trip Expenses',
      otherExpenses: 'Other Expenses',
    };

    return displayNames[fieldName] || fieldName;
  }
}
