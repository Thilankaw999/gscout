/**
 * Author: Insurance Portal Development Team
 * Created on: 2024-12-19
 * Description: ChatBot Intent Repository for managing chatbot interactions
 * Module: Insurance Property Portal Backend
 * Copyright (c) 2024 Proper Insure All rights reserved.
 */

import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.provider';
import { BaseRepository, PaginationOptions, PaginatedResult } from './base.repository';
import { chatbotIntents, ChatbotIntent, NewChatbotIntent } from '../schema/chatbot-intent.schema';

export interface ChatbotIntentFilters {
  userId?: number;
  intent?: string;
  sessionId?: string;
  processedFrom?: Date;
  processedTo?: Date;
}

@Injectable()
export class ChatbotIntentRepository extends BaseRepository<
  typeof chatbotIntents,
  ChatbotIntent,
  NewChatbotIntent
> {
  constructor(
    @Inject(DATABASE_CONNECTION)
    protected readonly db: MySql2Database,
  ) {
    super(db, chatbotIntents);
  }

  async findByUserId(userId: number): Promise<ChatbotIntent[]> {
    return await this.findMany(eq(chatbotIntents.userId, userId));
  }

  async findBySessionId(sessionId: string): Promise<ChatbotIntent[]> {
    return await this.db
      .select()
      .from(chatbotIntents)
      .where(eq(chatbotIntents.sessionId, sessionId))
      .orderBy(desc(chatbotIntents.processed));
  }

  async findByIntent(intent: string): Promise<ChatbotIntent[]> {
    return await this.findMany(eq(chatbotIntents.intent, intent));
  }

  async findIntentsWithFilters(
    filters: ChatbotIntentFilters,
    pagination: PaginationOptions = {},
  ): Promise<PaginatedResult<ChatbotIntent>> {
    const conditions = [];

    if (filters.userId) {
      conditions.push(eq(chatbotIntents.userId, filters.userId));
    }

    if (filters.intent) {
      conditions.push(eq(chatbotIntents.intent, filters.intent));
    }

    if (filters.sessionId) {
      conditions.push(eq(chatbotIntents.sessionId, filters.sessionId));
    }

    if (filters.processedFrom) {
      conditions.push(gte(chatbotIntents.processed, filters.processedFrom));
    }

    if (filters.processedTo) {
      conditions.push(lte(chatbotIntents.processed, filters.processedTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Default to ordering by most recent interactions first
    const paginationWithDefaults = {
      orderBy: 'processed',
      orderDirection: 'desc' as const,
      ...pagination,
    };

    return await this.paginate(paginationWithDefaults, whereClause);
  }

  async findRecentIntentsByUserId(userId: number, limit: number = 10): Promise<ChatbotIntent[]> {
    return await this.db
      .select()
      .from(chatbotIntents)
      .where(eq(chatbotIntents.userId, userId))
      .orderBy(desc(chatbotIntents.processed))
      .limit(limit);
  }

  async countIntentsByType(userId?: number): Promise<{ intent: string; count: number }[]> {
    const conditions = userId ? [eq(chatbotIntents.userId, userId)] : [];
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await this.db
      .select({
        intent: chatbotIntents.intent,
        count: sql<number>`count(*)`,
      })
      .from(chatbotIntents)
      .where(whereClause)
      .groupBy(chatbotIntents.intent);

    return result;
  }

  async findPopularIntents(limit: number = 10): Promise<{ intent: string; count: number }[]> {
    const result = await this.db
      .select({
        intent: chatbotIntents.intent,
        count: sql<number>`count(*)`,
      })
      .from(chatbotIntents)
      .groupBy(chatbotIntents.intent)
      .orderBy(sql`count(*) DESC`)
      .limit(limit);

    return result;
  }

  async findIntentsByDateRange(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<ChatbotIntent[]> {
    return await this.findMany(
      and(
        eq(chatbotIntents.userId, userId),
        gte(chatbotIntents.processed, startDate),
        lte(chatbotIntents.processed, endDate)
      )
    );
  }

  async getSessionInteractions(sessionId: string): Promise<ChatbotIntent[]> {
    return await this.db
      .select()
      .from(chatbotIntents)
      .where(eq(chatbotIntents.sessionId, sessionId))
      .orderBy(chatbotIntents.processed); // Chronological order for session
  }

  async deleteOldIntents(daysOld: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await this.deleteMany(
      sql`${chatbotIntents.processed} < ${cutoffDate}`,
      'system-cleanup'
    );
  }

  async findIntentsByParameters(
    userId: number,
    parameterKey: string,
    parameterValue: string
  ): Promise<ChatbotIntent[]> {
    return await this.findMany(
      and(
        eq(chatbotIntents.userId, userId),
        sql`JSON_EXTRACT(${chatbotIntents.parameters}, '$.${parameterKey}') = ${parameterValue}`
      )
    );
  }
} 