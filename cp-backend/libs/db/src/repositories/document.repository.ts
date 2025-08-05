/**
 * Author: Insurance Portal Development Team
 * Created on: 2024-12-19
 * Description: Document Repository for managing document metadata and S3 integration
 * Module: Insurance Property Portal Backend
 * Copyright (c) 2024 Proper Insure All rights reserved.
 */

import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.provider';
import { BaseRepository, PaginationOptions, PaginatedResult } from './base.repository';
import { documents, Document, NewDocument } from '../schema/document.schema';

export interface DocumentFilters {
  userId?: number;
  type?: string;
  uploadDateFrom?: Date;
  uploadDateTo?: Date;
  search?: string; // Search in document name
}

@Injectable()
export class DocumentRepository extends BaseRepository<
  typeof documents,
  Document,
  NewDocument
> {
  constructor(
    @Inject(DATABASE_CONNECTION)
    protected readonly db: MySql2Database,
  ) {
    super(db, documents);
  }

  async findByUserId(userId: number): Promise<Document[]> {
    return await this.findMany(eq(documents.userId, userId));
  }

  async findByType(userId: number, type: string): Promise<Document[]> {
    return await this.findMany(
      and(eq(documents.userId, userId), eq(documents.type, type))
    );
  }

  async findByS3Key(s3Key: string): Promise<Document | undefined> {
    return await this.findOne(eq(documents.s3Key, s3Key));
  }

  async findDocumentsWithFilters(
    filters: DocumentFilters,
    pagination: PaginationOptions = {},
  ): Promise<PaginatedResult<Document>> {
    const conditions = [];

    if (filters.userId) {
      conditions.push(eq(documents.userId, filters.userId));
    }

    if (filters.type) {
      conditions.push(eq(documents.type, filters.type));
    }

    if (filters.uploadDateFrom) {
      conditions.push(gte(documents.uploadDate, filters.uploadDateFrom));
    }

    if (filters.uploadDateTo) {
      conditions.push(lte(documents.uploadDate, filters.uploadDateTo));
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(sql`${documents.name} LIKE ${searchTerm}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Default to ordering by most recent uploads first
    const paginationWithDefaults = {
      orderBy: 'uploadDate',
      orderDirection: 'desc' as const,
      ...pagination,
    };

    return await this.paginate(paginationWithDefaults, whereClause);
  }

  async findExpiredUrls(): Promise<Document[]> {
    return await this.findMany(
      and(
        sql`${documents.urlExpiresAt} IS NOT NULL`,
        sql`${documents.urlExpiresAt} < NOW()`
      )
    );
  }

  async updateDownloadUrl(
    id: number,
    downloadUrl: string,
    expiresAt: Date
  ): Promise<Document | undefined> {
    return await this.update(id, {
      downloadUrl,
      urlExpiresAt: expiresAt,
    });
  }

  async clearExpiredUrls(): Promise<void> {
    await this.updateMany(
      and(
        sql`${documents.urlExpiresAt} IS NOT NULL`,
        sql`${documents.urlExpiresAt} < NOW()`
      ),
      {
        downloadUrl: null,
        urlExpiresAt: null,
      }
    );
  }

  async countDocumentsByType(userId?: number): Promise<{ type: string; count: number }[]> {
    const conditions = userId ? [eq(documents.userId, userId)] : [];
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await this.db
      .select({
        type: documents.type,
        count: sql<number>`count(*)`,
      })
      .from(documents)
      .where(whereClause)
      .groupBy(documents.type);

    return result;
  }

  async getTotalFileSize(userId?: number): Promise<number> {
    const conditions = userId ? [eq(documents.userId, userId)] : [];
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await this.db
      .select({
        total: sql<number>`COALESCE(SUM(${documents.fileSize}), 0)`,
      })
      .from(documents)
      .where(whereClause);

    return result[0]?.total || 0;
  }

  async findDocumentsByIds(documentIds: number[]): Promise<Document[]> {
    if (documentIds.length === 0) return [];
    return await this.findByIds(documentIds);
  }

  async findRecentDocuments(userId: number, limit: number = 5): Promise<Document[]> {
    return await this.db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(sql`${documents.uploadDate} DESC`)
      .limit(limit);
  }

  async updateS3Info(
    id: number,
    s3Bucket: string,
    s3Key: string,
    filePath: string
  ): Promise<Document | undefined> {
    return await this.update(id, {
      s3Bucket,
      s3Key,
      filePath,
    });
  }
} 