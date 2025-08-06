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
    customerEmail?: string;
    policyTermId?: number;
    damageType?: string;
    claimStatus?: string;
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

  async findByCustomerEmail(customerEmail: string): Promise<Claim[]> {
    return await this.findMany(eq(claims.customerEmail, customerEmail));
  }

  /**
   * Find all claims for a customer email formatted for mock API response
   * @param customerEmail - Customer email address
   * @returns Claims formatted for mock API response
   */
  async findClaimsByCustomerEmailForMockAPI(customerEmail: string): Promise<any[]> {
    try {
      const claimsList = await this.db
        .select()
        .from(claims)
        .where(eq(claims.customerEmail, customerEmail))
        .orderBy(desc(claims.lastUpdated));

      if (!claimsList || claimsList.length === 0) {
        return [];
      }

      // Format the response to match API specification
      const result = claimsList.map(claim => ({
        policy_term_id: claim.policyTermId?.toString() || '',
        id: `CLM-${claim.id.toString().padStart(5, '0')}`,
        damage_type: claim.damageType,
        date_of_loss: claim.dateOfLoss.toISOString().split('T')[0],
        date_filed: claim.dateFilled.toISOString().split('T')[0],
        claim_status: claim.claimStatus,
        location: {
          address_line1: claim.addressLine1,
          address_line2: claim.addressLine2 || '',
          city: claim.addressCity || '',
          state: claim.addressState || '',
          zip: claim.addressPostalCode || '',
          country: claim.addressCountry || 'USA',
        },
        estimatedDamage: claim.estimatedDamage ? parseFloat(claim.estimatedDamage) : 0,
        lastUpdated: claim.lastUpdated.toISOString().split('T')[0],
      }));

      return result;
    } catch (error) {
      throw error;
    }
  }

  async findClaimsWithFilters(
    filters: ClaimFilters,
    pagination: PaginationOptions = {},
  ): Promise<PaginatedResult<Claim>> {
    const conditions = [];

    if (filters.customerEmail) {
      conditions.push(eq(claims.customerEmail, filters.customerEmail));
    }

    if (filters.policyTermId) {
      conditions.push(eq(claims.policyTermId, filters.policyTermId));
    }

    if (filters.damageType) {
      conditions.push(eq(claims.damageType, filters.damageType));
    }

    if (filters.claimStatus) {
      conditions.push(eq(claims.claimStatus, filters.claimStatus));
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
        sql`(${claims.addressLine1} LIKE ${searchTerm} OR ${claims.addressLine2} LIKE ${searchTerm} OR ${claims.damageType} LIKE ${searchTerm})`
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

  async findActiveClaimsByCustomerEmail(customerEmail: string): Promise<Claim[]> {
    return await this.db
      .select()
      .from(claims)
      .where(
        and(
          eq(claims.customerEmail, customerEmail),
          sql`${claims.claimStatus} NOT IN ('Closed', 'Settled', 'Denied')`
        )
      )
      .orderBy(desc(claims.lastUpdated));
  }

  async findRecentClaimsByCustomerEmail(customerEmail: string, limit: number = 5): Promise<Claim[]> {
    return await this.db
      .select()
      .from(claims)
      .where(eq(claims.customerEmail, customerEmail))
      .orderBy(desc(claims.lastUpdated))
      .limit(limit);
  }

  async countClaimsByStatus(customerEmail?: string): Promise<{ claimStatus: string; count: number }[]> {
    const conditions = customerEmail ? [eq(claims.customerEmail, customerEmail)] : [];
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await this.db
      .select({
        claimStatus: claims.claimStatus,
        count: sql<number>`count(*)`,
      })
      .from(claims)
      .where(whereClause)
      .groupBy(claims.claimStatus);

    return result;
  }

  async updateClaimStatus(id: number, claimStatus: string): Promise<Claim | undefined> {
    return await this.update(id, { 
      claimStatus,
      lastUpdated: new Date(),
    });
  }

  async findClaimsByDateRange(
    customerEmail: string,
    startDate: Date,
    endDate: Date
  ): Promise<Claim[]> {
    return await this.findMany(
      and(
        eq(claims.customerEmail, customerEmail),
        gte(claims.dateOfLoss, startDate),
        lte(claims.dateOfLoss, endDate)
      )
    );
  }

  async getTotalEstimatedDamage(customerEmail?: string): Promise<number> {
    const conditions = customerEmail ? [eq(claims.customerEmail, customerEmail)] : [];
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