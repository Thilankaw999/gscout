/**
 * Author: Insurance Portal Development Team
 * Created on: 2024-12-19
 * Description: Property Repository for managing property/policy data
 * Module: Insurance Property Portal Backend
 * Copyright (c) 2024 Proper Insure All rights reserved.
 */

import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, like, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.provider';
import { BaseRepository, PaginationOptions, PaginatedResult } from './base.repository';
import { properties, Property, NewProperty } from '../schema/property.schema';

export interface PropertyFilters {
  userId?: number;
  type?: string;
  status?: string;
  search?: string; // Search in name, address, policy number
}

@Injectable()
export class PropertyRepository extends BaseRepository<
  typeof properties,
  Property,
  NewProperty
> {
  constructor(
    @Inject(DATABASE_CONNECTION)
    protected readonly db: MySql2Database,
  ) {
    super(db, properties);
  }

  async findByUserId(userId: number): Promise<Property[]> {
    return await this.findMany(eq(properties.userId, userId));
  }

  async findByPolicyNumber(policyNumber: string): Promise<Property | undefined> {
    return await this.findOne(eq(properties.policyNumber, policyNumber));
  }

  async findPropertiesWithFilters(
    filters: PropertyFilters,
    pagination: PaginationOptions = {},
  ): Promise<PaginatedResult<Property>> {
    const conditions = [];

    if (filters.userId) {
      conditions.push(eq(properties.userId, filters.userId));
    }

    if (filters.type) {
      conditions.push(eq(properties.type, filters.type));
    }

    if (filters.status) {
      conditions.push(eq(properties.status, filters.status));
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        sql`(${properties.name} LIKE ${searchTerm} OR ${properties.address} LIKE ${searchTerm} OR ${properties.policyNumber} LIKE ${searchTerm})`
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return await this.paginate(pagination, whereClause);
  }

  async findActivePropertiesByUserId(userId: number): Promise<Property[]> {
    return await this.findMany(
      and(eq(properties.userId, userId), eq(properties.status, 'ACTIVE'))
    );
  }

  async findExpiredPolicies(): Promise<Property[]> {
    return await this.findMany(
      sql`${properties.expirationDate} < CURDATE() AND ${properties.status} = 'ACTIVE'`
    );
  }

  async countPropertiesByType(userId?: number): Promise<{ type: string; count: number }[]> {
    const conditions = userId ? [eq(properties.userId, userId)] : [];
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const result = await this.db
      .select({
        type: properties.type,
        count: sql<number>`count(*)`,
      })
      .from(properties)
      .where(whereClause)
      .groupBy(properties.type);

    return result;
  }

  async findPropertiesByIds(propertyIds: number[]): Promise<Property[]> {
    if (propertyIds.length === 0) return [];
    return await this.findByIds(propertyIds);
  }

  async updatePropertyStatus(id: number, status: string): Promise<Property | undefined> {
    return await this.update(id, { status });
  }
} 