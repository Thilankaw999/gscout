/**
 * http-client.service.ts
 * Author: Insurance Portal Development Team
 * Description: Generic HTTP client service for all API communications
 * Module: Insurance Property Portal Backend - Common Library
 */

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Logger } from '@app/logger';

// Configuration constants
const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second base delay
};

// API Error interface
interface ApiError extends Error {
  statusCode: number;
  statusText: string;
  response?: any;
}

// HTTP Client configuration interface
interface HttpClientConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  defaultHeaders?: Record<string, string>;
}

@Injectable()
export class HttpClientService {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;
  private readonly defaultHeaders: Record<string, string>;

  constructor(private readonly logger: Logger) {
    // Default configuration - can be overridden by individual services
    this.baseUrl = '';
    this.timeout = API_CONFIG.timeout;
    this.retryAttempts = API_CONFIG.retryAttempts;
    this.retryDelay = API_CONFIG.retryDelay;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Create a new HTTP client instance with specific configuration
   */
  createClient(config: HttpClientConfig): HttpClientService {
    const client = new HttpClientService(this.logger);
    Object.assign(client, {
      baseUrl: config.baseUrl,
      timeout: config.timeout || this.timeout,
      retryAttempts: config.retryAttempts || this.retryAttempts,
      retryDelay: config.retryDelay || this.retryDelay,
      defaultHeaders: { ...this.defaultHeaders, ...config.defaultHeaders },
    });
    return client;
  }

  /**
   * Get request headers with defaults and additional headers
   */
  private async getRequestHeaders(additionalHeaders?: Record<string, string>): Promise<Record<string, string>> {
    return {
      ...this.defaultHeaders,
      ...additionalHeaders,
    };
  }

  /**
   * Handle HTTP response and extract data
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      const statusText = this.getStatusText(response.status);
      
      this.logger.error('HttpClientService: HTTP request failed', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: response.url,
      });

      // Create API error with detailed information
      const apiError: ApiError = new Error(statusText) as ApiError;
      apiError.statusCode = response.status;
      apiError.statusText = response.statusText;
      
      try {
        apiError.response = JSON.parse(errorText);
      } catch {
        apiError.response = errorText;
      }

      // Throw HttpException for NestJS to handle
      throw new HttpException(statusText, response.status);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return response.text() as unknown as T;
    }

    const data = await response.json();
    return data as T;
  }

  /**
   * Get human-readable status text
   */
  private getStatusText(status: number): string {
    switch (status) {
      case 400:
        return 'Bad Request';
      case 401:
        return 'Unauthorized - Please check your credentials';
      case 403:
        return 'Forbidden - You do not have permission to access this resource';
      case 404:
        return 'Resource not found';
      case 500:
        return 'Internal server error - Please try again later';
      case 502:
        return 'Bad Gateway - Service temporarily unavailable';
      case 503:
        return 'Service Unavailable - Please try again later';
      default:
        return `Request failed with status ${status}`;
    }
  }

  /**
   * Retry logic for failed requests
   */
  private async retryRequest<T>(
    requestFn: () => Promise<Response>,
    maxAttempts: number = this.retryAttempts
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await requestFn();
        return await this.handleResponse<T>(response);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on authentication or client errors
        if (error && typeof error === 'object' && 'statusCode' in error) {
          const apiError = error as ApiError;
          if (apiError.statusCode >= 400 && apiError.statusCode < 500) {
            throw error;
          }
        }

        if (attempt < maxAttempts) {
          const delay = this.retryDelay * attempt;
          this.logger.warn(`HttpClientService: Request failed, retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`, {
            error: lastError.message,
            attempt,
            maxAttempts,
            delay,
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Generic GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string>, headers?: Record<string, string>): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    this.logger.debug('HttpClientService: Making GET request', {
      url: url.toString(),
      params,
    });

    return this.retryRequest<T>(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const requestHeaders = await this.getRequestHeaders(headers);
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: requestHeaders,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });
  }

  /**
   * Generic POST request
   */
  async post<T>(endpoint: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);

    this.logger.debug('HttpClientService: Making POST request', {
      url: url.toString(),
      hasData: !!data,
    });

    return this.retryRequest<T>(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const requestHeaders = await this.getRequestHeaders(headers);
        const response = await fetch(url.toString(), {
          method: 'POST',
          headers: requestHeaders,
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });
  }

  /**
   * Generic PUT request
   */
  async put<T>(endpoint: string, data?: unknown, headers?: Record<string, string>): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);

    this.logger.debug('HttpClientService: Making PUT request', {
      url: url.toString(),
      hasData: !!data,
    });

    return this.retryRequest<T>(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const requestHeaders = await this.getRequestHeaders(headers);
        const response = await fetch(url.toString(), {
          method: 'PUT',
          headers: requestHeaders,
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);

    this.logger.debug('HttpClientService: Making DELETE request', {
      url: url.toString(),
    });

    return this.retryRequest<T>(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const requestHeaders = await this.getRequestHeaders(headers);
        const response = await fetch(url.toString(), {
          method: 'DELETE',
          headers: requestHeaders,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });
  }
} 