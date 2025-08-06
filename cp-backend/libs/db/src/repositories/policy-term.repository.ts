/**
 * Author: Insurance Portal Development Team
 * Created on: 2024-12-19
 * Description: Simplified Policy Term Repository
 * Module: Insurance Property Portal Backend
 * Copyright (c) 2024 Proper Insure All rights reserved.
 */

import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.provider';
import { BaseRepository } from './base.repository';
import { 
  policyTerms, 
  PolicyTerm, 
  NewPolicyTerm 
} from '../schema/policy.schema';

@Injectable()
export class PolicyTermRepository extends BaseRepository<
  typeof policyTerms,
  PolicyTerm,
  NewPolicyTerm
> {
  constructor(
    @Inject(DATABASE_CONNECTION)
    protected readonly db: MySql2Database,
  ) {
    super(db, policyTerms);
  }

  /**
   * Find all terms for a policy
   * @param policyId - Policy ID
   * @returns Array of all policy terms ordered by effective date (newest first)
   */
  async findAllTermsByPolicyId(policyId: number): Promise<PolicyTerm[]> {
    try {
      return await this.db
        .select()
        .from(policyTerms)
        .where(
          and(
            eq(policyTerms.policyId, policyId),
            isNull(policyTerms.deletedAt)
          )
        )
        .orderBy(desc(policyTerms.effectiveDate));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find term by term ID
   * @param termId - Term ID
   * @returns Policy term or null
   */
  async findByTermId(termId: string): Promise<PolicyTerm | null> {
    try {
      const [term] = await this.db
        .select()
        .from(policyTerms)
        .where(
          and(
            eq(policyTerms.termId, termId),
            isNull(policyTerms.deletedAt)
          )
        )
        .limit(1);

      return term || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new policy term
   * @param termData - Policy term data
   * @returns Created policy term
   */
  async createTerm(termData: NewPolicyTerm): Promise<PolicyTerm> {
    try {
      const result = await this.db
        .insert(policyTerms)
        .values(termData);

      const insertResult = result[0] as any;
      const newTerm = await this.db
        .select()
        .from(policyTerms)
        .where(eq(policyTerms.id, insertResult.insertId))
        .limit(1);

      return newTerm[0];
    } catch (error) {
      throw error;
    }
  }
} 