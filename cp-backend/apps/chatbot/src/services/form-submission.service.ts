/**
 * Author: Assistant
 * Created on: 2025-08-07
 * Description: API client service for submitting form data to external systems
 * Module: Girl Scouts Chatbot
 * Copyright (c) 2024 Girl Scouts All rights reserved.
 */

import { Injectable } from '@nestjs/common';
import { Logger } from '@app/logger';
import { ConfigProvider, HttpClientService } from '@app/common';
import { FormDataDto } from '../dto/chatbot.dto';

export interface FormSubmissionResponse {
  success: boolean;
  submissionId?: string;
  message: string;
  timestamp: Date;
}

@Injectable()
export class FormSubmissionService {
  private readonly httpClient: HttpClientService;

  constructor(
    private readonly logger: Logger,
    private readonly configProvider: ConfigProvider,
    private readonly baseHttpClientService: HttpClientService,
  ) {
    // Configure HTTP client for form submissions
    const isLocalDevelopment = process.env.IS_OFFLINE === 'true';
    
    const baseUrl = isLocalDevelopment
      ? this.configProvider.get('FORM_SUBMISSION_API_URL.local') || 'http://localhost:3000/api'
      : this.configProvider.get('FORM_SUBMISSION_API_URL.production') || 'https://api.girlscouts.org';

    this.httpClient = this.baseHttpClientService.createClient({
      baseUrl,
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'User-Agent': 'GirlScouts-Chatbot/1.0',
      },
    });
  }

  /**
   * Submit completed form data to external API
   */
  async submitFormData(
    sessionId: string,
    formData: Partial<FormDataDto>,
    formType: string = 'general_application'
  ): Promise<FormSubmissionResponse> {
    try {
      this.logger.debug('FormSubmissionService: Submitting form data', {
        sessionId,
        formType,
        fieldsCount: Object.keys(formData).length,
      });

      // Validate required fields
      this.validateFormData(formData);

      // Prepare submission payload
      const submissionPayload = {
        sessionId,
        formType,
        submittedAt: new Date().toISOString(),
        data: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          age: parseInt(formData.age || '0', 10),
          preferredActivity: formData.preferredActivity,
        },
        source: 'chatbot',
        version: '1.0',
      };

      // Make API call
      const response = await this.httpClient.post('/forms/submit', submissionPayload);

      const submissionResponse: FormSubmissionResponse = {
        success: true,
        submissionId: (response as any).data?.submissionId || this.generateSubmissionId(),
        message: (response as any).data?.message || 'Form submitted successfully',
        timestamp: new Date(),
      };

      this.logger.info('FormSubmissionService: Form submitted successfully', {
        sessionId,
        submissionId: submissionResponse.submissionId,
      });

      return submissionResponse;

    } catch (error) {
      this.logger.error('FormSubmissionService: Form submission failed', {
        sessionId,
        error: error.message,
        formData: this.sanitizeFormDataForLogging(formData),
      });

      // Handle different types of errors
      if (error.response?.status === 400) {
        return {
          success: false,
          message: 'Invalid form data provided',
          timestamp: new Date(),
        };
      }

      if (error.response?.status >= 500) {
        return {
          success: false,
          message: 'Service temporarily unavailable. Please try again later.',
          timestamp: new Date(),
        };
      }

      // For development/testing - simulate successful submission
      if (process.env.IS_OFFLINE === 'true') {
        this.logger.warn('FormSubmissionService: Simulating successful submission (offline mode)', {
          sessionId,
        });

        return {
          success: true,
          submissionId: this.generateSubmissionId(),
          message: 'Form submitted successfully (simulated)',
          timestamp: new Date(),
        };
      }

      return {
        success: false,
        message: 'Failed to submit form. Please try again.',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Validate form data before submission
   */
  private validateFormData(formData: Partial<FormDataDto>): void {
    const requiredFields = ['fullName', 'email', 'phone', 'age', 'preferredActivity'];
    const missingFields = requiredFields.filter(field => !formData[field]?.trim());

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email || '')) {
      throw new Error('Invalid email format');
    }

    // Validate age
    const age = parseInt(formData.age || '0', 10);
    if (age < 5 || age > 18) {
      throw new Error('Age must be between 5 and 18 for Girl Scouts programs');
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = (formData.phone || '').replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone) || cleanPhone.length < 10) {
      throw new Error('Invalid phone number format');
    }
  }

  /**
   * Generate unique submission ID
   */
  private generateSubmissionId(): string {
    return `gs_sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize form data for logging (remove sensitive information)
   */
  private sanitizeFormDataForLogging(formData: Partial<FormDataDto>): any {
    return {
      fullName: formData.fullName ? '[PROVIDED]' : '[MISSING]',
      email: formData.email ? '[PROVIDED]' : '[MISSING]',
      phone: formData.phone ? '[PROVIDED]' : '[MISSING]',
      age: formData.age || '[MISSING]',
      preferredActivity: formData.preferredActivity || '[MISSING]',
    };
  }

  /**
   * Test connection to form submission API
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.httpClient.get('/health', { timeout: '5000' });
      return true;
    } catch (error) {
      this.logger.warn('FormSubmissionService: API connection test failed', {
        error: error.message,
      });
      return false;
    }
  }
}
