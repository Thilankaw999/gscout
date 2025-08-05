/**
 * Author: Insurance Portal Development Team
 * Created on: 2024-12-19
 * Description: Claim Repository for managing insurance claims data
 * Module: Insurance Property Portal Backend
 * Copyright (c) 2024 Proper Insure All rights reserved.
 */

import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.provider';
import { BaseRepository, PaginationOptions, PaginatedResult } from './base.repository';
import { claims, Claim, NewClaim } from '../schema/claim.schema';

export interface ClaimFilters {
  userId?: number;
  propertyId?: number;
  damageType?: string;
  progress?: string;
  dateOfLossFrom?: Date;
  dateOfLossTo?: Date;
  search?: string; // Search in claim number, address, damage type
}

@Injectable()
export class ClaimRepository extends BaseRepository<
  typeof claims,
  Claim,
  NewClaim
> {
  constructor(
    @Inject(DATABASE_CONNECTION)
    protected readonly db: MySql2Database,
  ) {
    super(db, claims);
  }

  async findByUserId(userId: number): Promise<Claim[]> {
    return await this.findMany(eq(claims.userId, userId));
  }

  async findByClaimNumber(claimNumber: string): Promise<Claim | undefined> {
    return await this.findOne(eq(claims.number, claimNumber));
  }

  async findByPropertyId(propertyId: number): Promise<Claim[]> {
    return await this.findMany(eq(claims.propertyId, propertyId));
  }

  async findClaimsWithFilters(
    filters: ClaimFilters,
    pagination: PaginationOptions = {},
  ): Promise<PaginatedResult<Claim>> {
    const conditions = [];

    if (filters.userId) {
      conditions.push(eq(claims.userId, filters.userId));
    }

    if (filters.propertyId) {
      conditions.push(eq(claims.propertyId, filters.propertyId));
    }

    if (filters.damageType) {
      conditions.push(eq(claims.damageType, filters.damageType));
    }

    if (filters.progress) {
      conditions.push(eq(claims.progress, filters.progress));
    }

    if (filters.dateOfLossFrom) {
      conditions.push(gte(claims.dateOfLoss, filters.dateOfLossFrom));
    }

    if (filters.dateOfLossTo) {
      conditions.push(lte(claims.dateOfLoss, filters.dateOfLossTo));
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        sql`(${claims.number} LIKE ${searchTerm} OR ${claims.address} LIKE ${searchTerm} OR ${claims.damageType} LIKE ${searchTerm})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Default to ordering by most recent claims first
    const paginationWithDefaults = {
      orderBy: 'lastUpdated',
      orderDirection: 'desc' as const,
      ...pagination,
    };

    return await this.paginate(paginationWithDefaults, whereClause);
  }

  async findActiveClaimsByUserId(userId: number): Promise<Claim[]> {
    return await this.db
      .select()
      .from(claims)
      .where(
        and(
          eq(claims.userId, userId),
          sql`${claims.progress} NOT IN ('Closed', 'Settled', 'Denied')`
        )
      )
      .orderBy(desc(claims.lastUpdated));
  }

  async findRecentClaimsByUserId(userId: number, limit: number = 5): Promise<Claim[]> {
    return await this.db
      .select()
      .from(claims)
      .where(eq(claims.userId, userId))
      .orderBy(desc(claims.lastUpdated))
      .limit(limit);
  }

  async countClaimsByStatus(userId?: number): Promise<{ progress: string; count: number }[]> {
    const conditions = userId ? [eq(claims.userId, userId)] : [];
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await this.db
      .select({
        progress: claims.progress,
        count: sql<number>`count(*)`,
      })
      .from(claims)
      .where(whereClause)
      .groupBy(claims.progress);

    return result;
  }

  async updateClaimProgress(id: number, progress: string): Promise<Claim | undefined> {
    return await this.update(id, { 
      progress,
      lastUpdated: new Date(),
    });
  }

  async findClaimsByDateRange(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<Claim[]> {
    return await this.findMany(
      and(
        eq(claims.userId, userId),
        gte(claims.dateOfLoss, startDate),
        lte(claims.dateOfLoss, endDate)
      )
    );
  }

  async getTotalEstimatedDamage(userId?: number): Promise<number> {
    const conditions = userId ? [eq(claims.userId, userId)] : [];
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await this.db
      .select({
        total: sql<number>`COALESCE(SUM(${claims.estimatedDamage}), 0)`,
      })
      .from(claims)
      .where(whereClause);

    return result[0]?.total || 0;
  }
} 