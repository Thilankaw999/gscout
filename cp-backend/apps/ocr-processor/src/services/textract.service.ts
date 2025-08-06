/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: AWS Textract Service
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import { Injectable } from '@nestjs/common';
import { 
  TextractClient, 
  AnalyzeDocumentCommand, 
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
  AnalyzeDocumentCommandInput,
  StartDocumentAnalysisCommandInput 
} from '@aws-sdk/client-textract';
import { Logger } from '@aws-lambda-powertools/logger';

@Injectable()
export class TextractService {
  private readonly textract: TextractClient;
  private readonly logger = new Logger({ serviceName: 'TextractService' });

  constructor() {
    this.textract = new TextractClient({ 
      region: process.env.AWS_REGION || 'us-east-1' 
    });
  }

  /**
   * Synchronous document analysis for smaller documents
   */
  async analyzeDocument(params: {
    bucket: string;
    key: string;
    featureTypes?: string[];
  }): Promise<any> {
    const startTime = Date.now();
    
    this.logger.info('Starting Textract document analysis', {
      bucket: params.bucket,
      key: params.key,
      featureTypes: params.featureTypes,
    });

    const input: AnalyzeDocumentCommandInput = {
      Document: {
        S3Object: {
          Bucket: params.bucket,
          Name: params.key,
        },
      },
      FeatureTypes: params.featureTypes || ['FORMS', 'TABLES'],
    };

    try {
      const command = new AnalyzeDocumentCommand(input);
      const result = await this.textract.send(command);
      
      const processingTime = Date.now() - startTime;
      
      this.logger.info('Textract analysis completed', {
        bucket: params.bucket,
        key: params.key,
        processingTime,
        blockCount: result.Blocks?.length || 0,
      });

      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error('Textract analysis failed', {
        error: error.message,
        bucket: params.bucket,
        key: params.key,
        processingTime,
      });

      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  /**
   * Asynchronous document analysis for larger documents
   */
  async startDocumentAnalysis(params: {
    bucket: string;
    key: string;
    featureTypes?: string[];
    notificationTopic?: string;
    roleArn?: string;
  }): Promise<{ JobId: string }> {
    this.logger.info('Starting async Textract document analysis', {
      bucket: params.bucket,
      key: params.key,
      featureTypes: params.featureTypes,
    });

    const input: StartDocumentAnalysisCommandInput = {
      DocumentLocation: {
        S3Object: {
          Bucket: params.bucket,
          Name: params.key,
        },
      },
      FeatureTypes: params.featureTypes || ['FORMS', 'TABLES'],
    };

    // Add notification channel if provided
    if (params.notificationTopic && params.roleArn) {
      input.NotificationChannel = {
        SNSTopicArn: params.notificationTopic,
        RoleArn: params.roleArn,
      };
    }

    try {
      const command = new StartDocumentAnalysisCommand(input);
      const result = await this.textract.send(command);
      
      this.logger.info('Async Textract analysis started', {
        bucket: params.bucket,
        key: params.key,
        jobId: result.JobId,
      });

      return { JobId: result.JobId! };
    } catch (error) {
      this.logger.error('Failed to start async Textract analysis', {
        error: error.message,
        bucket: params.bucket,
        key: params.key,
      });

      throw new Error(`Failed to start OCR processing: ${error.message}`);
    }
  }

  /**
   * Get results from asynchronous document analysis
   */
  async getDocumentAnalysis(jobId: string): Promise<any> {
    this.logger.info('Getting Textract analysis results', { jobId });

    try {
      const command = new GetDocumentAnalysisCommand({ JobId: jobId });
      const result = await this.textract.send(command);
      
      this.logger.info('Retrieved Textract analysis results', {
        jobId,
        jobStatus: result.JobStatus,
        blockCount: result.Blocks?.length || 0,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to get Textract analysis results', {
        error: error.message,
        jobId,
      });

      throw new Error(`Failed to retrieve OCR results: ${error.message}`);
    }
  }

  /**
   * Analyze expense documents (specific to financial documents)
   */
  async analyzeExpense(params: {
    bucket: string;
    key: string;
  }): Promise<any> {
    this.logger.info('Starting Textract expense analysis', {
      bucket: params.bucket,
      key: params.key,
    });

    // This would use AnalyzeExpenseCommand for better financial document processing
    // For now, using regular document analysis
    return this.analyzeDocument({
      bucket: params.bucket,
      key: params.key,
      featureTypes: ['FORMS', 'TABLES'],
    });
  }
}
