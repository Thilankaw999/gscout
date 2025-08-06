/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: TFR Document Schema
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import { int, mysqlTable, varchar, date, json, mysqlEnum, decimal } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { auditFields } from './base.schema';

// TFR Documents table
export const tfrDocuments = mysqlTable('tfr_documents', {
  id: int('id').primaryKey().autoincrement(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  s3Key: varchar('s3_key', { length: 500 }).notNull(),
  s3Bucket: varchar('s3_bucket', { length: 255 }).notNull(),
  troopId: varchar('troop_id', { length: 50 }).notNull(),
  troopName: varchar('troop_name', { length: 255 }),
  reportPeriod: date('report_period').notNull(),
  reportYear: int('report_year').notNull(),
  fileSize: int('file_size'), // in bytes
  mimeType: varchar('mime_type', { length: 100 }).default('application/pdf'),
  
  // Processing status
  status: mysqlEnum('status', [
    'uploaded', 
    'processing', 
    'ocr_completed', 
    'validation_completed', 
    'completed', 
    'failed'
  ]).notNull().default('uploaded'),
  
  processingStartedAt: date('processing_started_at'),
  processingCompletedAt: date('processing_completed_at'),
  
  // OCR Results from Textract
  ocrResults: json('ocr_results').$type<{
    textractJobId?: string;
    confidence: number;
    rawTextractOutput: any;
    extractedFields: Record<string, any>;
    processingTime: number; // in milliseconds
  }>(),
  
  // Validation Results
  validationResults: json('validation_results').$type<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    validatedAt: string;
    validatedBy: string;
  }>(),
  
  // Error tracking
  errorMessage: varchar('error_message', { length: 1000 }),
  retryCount: int('retry_count').default(0),
  
  ...auditFields,
});

// Extracted Financial Data table - normalized financial data from TFR
export const extractedFinancialData = mysqlTable('extracted_financial_data', {
  id: int('id').primaryKey().autoincrement(),
  documentId: int('document_id').notNull(),
  troopId: varchar('troop_id', { length: 50 }).notNull(),
  reportPeriod: date('report_period').notNull(),
  reportYear: int('report_year').notNull(),
  
  // Financial fields from TFR
  beginningBalance: decimal('beginning_balance', { precision: 12, scale: 2 }),
  totalIncome: decimal('total_income', { precision: 12, scale: 2 }),
  totalExpenses: decimal('total_expenses', { precision: 12, scale: 2 }),
  endingBalance: decimal('ending_balance', { precision: 12, scale: 2 }),
  
  // Detailed income breakdown
  cookieIncome: decimal('cookie_income', { precision: 12, scale: 2 }),
  fallProductIncome: decimal('fall_product_income', { precision: 12, scale: 2 }),
  otherIncome: decimal('other_income', { precision: 12, scale: 2 }),
  
  // Detailed expense breakdown
  badgeExpenses: decimal('badge_expenses', { precision: 12, scale: 2 }),
  meetingExpenses: decimal('meeting_expenses', { precision: 12, scale: 2 }),
  tripExpenses: decimal('trip_expenses', { precision: 12, scale: 2 }),
  otherExpenses: decimal('other_expenses', { precision: 12, scale: 2 }),
  
  // Validation status
  isValidated: mysqlEnum('is_validated', ['pending', 'valid', 'invalid', 'needs_review']).default('pending'),
  validationErrors: json('validation_errors').$type<string[]>(),
  validationWarnings: json('validation_warnings').$type<string[]>(),
  
  // Confidence scores
  overallConfidence: decimal('overall_confidence', { precision: 5, scale: 2 }),
  fieldConfidences: json('field_confidences').$type<Record<string, number>>(),
  
  ...auditFields,
});

// Bank Statement Validation table - for cross-checking TFR data
export const bankStatementValidations = mysqlTable('bank_statement_validations', {
  id: int('id').primaryKey().autoincrement(),
  tfrDocumentId: int('tfr_document_id').notNull(),
  bankStatementS3Key: varchar('bank_statement_s3_key', { length: 500 }),
  bankName: varchar('bank_name', { length: 100 }),
  accountNumber: varchar('account_number', { length: 50 }), // masked/encrypted
  statementPeriod: date('statement_period'),
  
  // Validation results
  balanceMatches: mysqlEnum('balance_matches', ['yes', 'no', 'partial', 'unknown']).default('unknown'),
  extractedBankBalance: decimal('extracted_bank_balance', { precision: 12, scale: 2 }),
  balanceDifference: decimal('balance_difference', { precision: 12, scale: 2 }),
  
  validationStatus: mysqlEnum('validation_status', ['pending', 'completed', 'failed']).default('pending'),
  validationNotes: varchar('validation_notes', { length: 1000 }),
  
  ...auditFields,
});

// Processing Audit Log - track all processing steps
export const processingAuditLog = mysqlTable('processing_audit_log', {
  id: int('id').primaryKey().autoincrement(),
  documentId: int('document_id').notNull(),
  stepName: varchar('step_name', { length: 100 }).notNull(),
  stepStatus: mysqlEnum('step_status', ['started', 'completed', 'failed', 'skipped']).notNull(),
  stepDetails: json('step_details').$type<Record<string, any>>(),
  processingTime: int('processing_time'), // in milliseconds
  errorMessage: varchar('error_message', { length: 1000 }),
  
  ...auditFields,
});

// Define relationships
export const tfrDocumentsRelations = relations(tfrDocuments, ({ one, many }) => ({
  extractedData: one(extractedFinancialData, {
    fields: [tfrDocuments.id],
    references: [extractedFinancialData.documentId],
  }),
  bankValidation: one(bankStatementValidations, {
    fields: [tfrDocuments.id],
    references: [bankStatementValidations.tfrDocumentId],
  }),
  auditLogs: many(processingAuditLog),
}));

export const extractedFinancialDataRelations = relations(extractedFinancialData, ({ one }) => ({
  document: one(tfrDocuments, {
    fields: [extractedFinancialData.documentId],
    references: [tfrDocuments.id],
  }),
}));

export const bankStatementValidationsRelations = relations(bankStatementValidations, ({ one }) => ({
  tfrDocument: one(tfrDocuments, {
    fields: [bankStatementValidations.tfrDocumentId],
    references: [tfrDocuments.id],
  }),
}));

export const processingAuditLogRelations = relations(processingAuditLog, ({ one }) => ({
  document: one(tfrDocuments, {
    fields: [processingAuditLog.documentId],
    references: [tfrDocuments.id],
  }),
}));

// Type definitions for TypeScript
export type TfrDocument = typeof tfrDocuments.$inferSelect;
export type NewTfrDocument = typeof tfrDocuments.$inferInsert;
export type ExtractedFinancialData = typeof extractedFinancialData.$inferSelect;
export type NewExtractedFinancialData = typeof extractedFinancialData.$inferInsert;
export type BankStatementValidation = typeof bankStatementValidations.$inferSelect;
export type NewBankStatementValidation = typeof bankStatementValidations.$inferInsert;
export type ProcessingAuditLog = typeof processingAuditLog.$inferSelect;
export type NewProcessingAuditLog = typeof processingAuditLog.$inferInsert;
