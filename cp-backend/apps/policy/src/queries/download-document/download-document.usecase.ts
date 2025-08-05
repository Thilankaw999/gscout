/**
 * download-document.usecase.ts
 * Author: Insurance Portal Development Team
 * Description: Downloads a document file for the authenticated user
 * Module: Insurance Property Portal Backend
 */

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UseCase } from '@app/common';
import { DocumentRepository } from '@app/db';
import { UserContextService } from '@app/user-context';
import { Logger } from '@app/logger';
import { S3Service } from '@app/aws/s3';

export interface DownloadDocumentResult {
  fileBuffer: Buffer;
  contentType: string;
  fileName: string;
  fileSize: number;
}

@Injectable()
export class DownloadDocumentUseCase extends UseCase<string, DownloadDocumentResult> {
  constructor(
    private readonly userContextService: UserContextService,
    private readonly documentRepository: DocumentRepository,
    private readonly s3Service: S3Service,
    private readonly logger: Logger,
  ) {
    super();
  }

  async execute(documentId: string): Promise<DownloadDocumentResult> {
    try {
      // Get user context from the request (populated by middleware)
      const userContext = this.userContextService.getUserContext();
      const { userId } = userContext;

      this.logger.debug('DownloadDocumentUseCase: Starting document download', {
        userId,
        documentId,
      });

      // Validate that we have a valid user ID
      if (!userId || userId <= 0) {
        this.logger.error('DownloadDocumentUseCase: Invalid user ID', { userId });
        throw new NotFoundException('Invalid user context');
      }

      // Find the document
      const document = await this.documentRepository.findById(parseInt(documentId));

      if (!document) {
        this.logger.warn('DownloadDocumentUseCase: Document not found', {
          documentId,
          userId,
        });
        throw new NotFoundException('Document not found');
      }

      // Verify the document belongs to the authenticated user
      if (document.userId !== userId) {
        this.logger.warn('DownloadDocumentUseCase: User not authorized to access document', {
          documentId,
          userId,
          documentUserId: document.userId,
        });
        throw new ForbiddenException('Not authorized to access this document');
      }

      // Download the file from S3
      const fileStream = await this.s3Service.getFile({
        Bucket: document.s3Bucket || 'default-documents-bucket',
        Key: document.s3Key || document.filePath,
      });

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of fileStream) {
        chunks.push(chunk);
      }
      const fileBuffer = Buffer.concat(chunks);

      this.logger.debug('DownloadDocumentUseCase: Successfully downloaded document', {
        documentId,
        userId,
        fileName: document.name,
        fileSize: fileBuffer.length,
      });

      return {
        fileBuffer,
        contentType: document.contentType || 'application/octet-stream',
        fileName: document.name,
        fileSize: document.fileSize || fileBuffer.length,
      };
    } catch (error) {
      this.logger.error('DownloadDocumentUseCase: Error downloading document', {
        error: error.message,
        stack: error.stack,
        userId: this.userContextService.getUserId(),
        documentId,
      });

      // Re-throw the error if it's already a known exception
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      // For S3 or other unexpected errors, throw a generic error
      throw new Error('Failed to download document');
    }
  }
} 