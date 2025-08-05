/**
 * get-documents.usecase.ts
 * Author: Insurance Portal Development Team
 * Description: Retrieves documents for the authenticated user
 * Module: Insurance Property Portal Backend
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { UseCase } from '@app/common';
import { DocumentRepository } from '@app/db';
import { UserContextService } from '@app/user-context';
import { Logger } from '@app/logger';
import { GetDocumentsQueryDto, DocumentResponseDto } from '../../dto/get-documents.dto';

@Injectable()
export class GetDocumentsUseCase extends UseCase<GetDocumentsQueryDto, DocumentResponseDto[]> {
  constructor(
    private readonly userContextService: UserContextService,
    private readonly documentRepository: DocumentRepository,
    private readonly logger: Logger,
  ) {
    super();
  }

  async execute(query: GetDocumentsQueryDto): Promise<DocumentResponseDto[]> {
    try {
      // Get user context from the request (populated by middleware)
      const userContext = this.userContextService.getUserContext();
      const { userId } = userContext;

      this.logger.debug('GetDocumentsUseCase: Starting documents retrieval', {
        userId,
        query,
      });

      // Validate that we have a valid user ID
      if (!userId || userId <= 0) {
        this.logger.error('GetDocumentsUseCase: Invalid user ID', { userId });
        throw new NotFoundException('Invalid user context');
      }

      // Prepare filters for document repository
      const filters = {
        userId,
        type: query.type,
        uploadDateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
        uploadDateTo: query.dateTo ? new Date(query.dateTo) : undefined,
        search: query.search,
      };

      // Prepare pagination options
      const pagination = {
        page: query.page || 1,
        limit: query.limit || 10,
        orderBy: 'uploadDate',
        orderDirection: 'desc' as const,
      };

      // Fetch documents with filters and pagination
      const result = await this.documentRepository.findDocumentsWithFilters(
        filters,
        pagination,
      );

      this.logger.debug('GetDocumentsUseCase: Successfully retrieved documents', {
        userId,
        count: result.data.length,
        total: result.total,
      });

      // Transform documents to DocumentResponseDto format
      const documents: DocumentResponseDto[] = result.data.map((document) => ({
        id: document.id.toString(),
        name: document.name,
        type: document.type,
        uploadDate: document.uploadDate?.toISOString().split('T')[0] || '',
        downloadUrl: `/api/documents/${document.id}/download`,
        fileSize: document.fileSize || undefined,
        contentType: document.contentType || undefined,
      }));

      return documents;
    } catch (error) {
      this.logger.error('GetDocumentsUseCase: Error retrieving documents', {
        error: error.message,
        stack: error.stack,
        userId: this.userContextService.getUserId(),
        query,
      });

      // Re-throw the error if it's already a known exception
      if (error instanceof NotFoundException) {
        throw error;
      }

      // For database or other unexpected errors, throw a generic error
      throw new Error('Failed to retrieve documents information');
    }
  }
} 