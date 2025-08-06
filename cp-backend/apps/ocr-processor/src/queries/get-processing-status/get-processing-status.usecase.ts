/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: Get Processing Status Use Case
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import { Injectable } from '@nestjs/common';
import { UseCase } from '@app/common';
import { DatabaseService } from '@app/db';
import { eq } from 'drizzle-orm';
import { tfrDocuments } from '@app/db/schema';
import { GetProcessingStatusQuery } from './get-processing-status.query';
import { ProcessingStatusDto } from '../../dto/ocr-processing.dto';

@Injectable()
export class GetProcessingStatusUseCase extends UseCase<GetProcessingStatusQuery, ProcessingStatusDto> {
  constructor(private readonly db: DatabaseService) {
    super();
  }

  async execute(query: GetProcessingStatusQuery): Promise<ProcessingStatusDto> {
    const [document] = await this.db.db
      .select({
        id: tfrDocuments.id,
        fileName: tfrDocuments.fileName,
        troopId: tfrDocuments.troopId,
        status: tfrDocuments.status,
        processingStartedAt: tfrDocuments.processingStartedAt,
        processingCompletedAt: tfrDocuments.processingCompletedAt,
        errorMessage: tfrDocuments.errorMessage,
        retryCount: tfrDocuments.retryCount,
        ocrResults: tfrDocuments.ocrResults,
      })
      .from(tfrDocuments)
      .where(eq(tfrDocuments.id, query.documentId))
      .limit(1);

    if (!document) {
      throw new Error(`Document with ID ${query.documentId} not found`);
    }

    return {
      documentId: document.id,
      fileName: document.fileName,
      troopId: document.troopId,
      status: document.status,
      processingStartedAt: document.processingStartedAt,
      processingCompletedAt: document.processingCompletedAt,
      errorMessage: document.errorMessage,
      retryCount: document.retryCount,
      overallConfidence: document.ocrResults?.confidence,
    };
  }
}
