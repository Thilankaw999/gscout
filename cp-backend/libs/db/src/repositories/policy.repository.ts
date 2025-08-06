/**
 * Author: Insurance Portal Development Team
 * Created on: 2024-12-19
 * Updated on: 2024-12-19
 * Description: Simplified Policy Repository for basic policy and terms management
 * Module: Insurance Property Portal Backend
 * Copyright (c) 2024 Proper Insure All rights reserved.
 */

import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.provider';
import { BaseRepository } from './base.repository';
import { 
  policies, 
  policyTerms,
  Policy, 
  NewPolicy,
  PolicyTerm,
  NewPolicyTerm,
  CompletePolicy,
  PolicyApiResponse
} from '../schema/policy.schema';

@Injectable()
export class PolicyRepository extends BaseRepository<
  typeof policies,
  Policy,
  NewPolicy
> {
  constructor(
    @Inject(DATABASE_CONNECTION)
    protected readonly db: MySql2Database,
  ) {
    super(db, policies);
  }

  /**
   * Find all policies for a customer email formatted for API response
   * @param customerEmail - Customer email address
   * @returns Policies formatted for API response
   */
  async findPoliciesByCustomerEmailForAPI(customerEmail: string): Promise<PolicyApiResponse[]> {
    try {
      // Get all policies for the customer
      const policyList = await this.db
        .select()
        .from(policies)
        .where(
          and(
            eq(policies.customerEmail, customerEmail),
            isNull(policies.deletedAt)
          )
        )
        .orderBy(desc(policies.createdAt));

      if (!policyList || policyList.length === 0) {
        return [];
      }

      // Get all policy terms for these policies
      const policyIds = policyList.map(p => p.id);
      const allTerms = await this.db
        .select()
        .from(policyTerms)
        .where(
          and(
            eq(policyTerms.policyId, policyIds[0]), // This needs to be fixed for multiple policies
            isNull(policyTerms.deletedAt)
          )
        )
        .orderBy(desc(policyTerms.effectiveDate));

      // Group terms by policy ID
      const termsByPolicy = new Map<number, PolicyTerm[]>();
      for (const policy of policyList) {
        const terms = await this.db
          .select()
          .from(policyTerms)
          .where(
            and(
              eq(policyTerms.policyId, policy.id),
              isNull(policyTerms.deletedAt)
            )
          )
          .orderBy(desc(policyTerms.effectiveDate));
        
        termsByPolicy.set(policy.id, terms);
      }

      // Format the response to match API specification
      const result: PolicyApiResponse[] = policyList.map(policy => ({
        policy_chain_id: policy.policyChainId,
        insured_name: policy.insuredName,
        type: policy.type,
        policy_terms: (termsByPolicy.get(policy.id) || []).map(term => ({
          id: term.termId,
          effective_date: term.effectiveDate.toISOString().split('T')[0],
          expiration_date: term.expirationDate.toISOString().split('T')[0],
        })),
      }));

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find policies by customer email (simple method)
   * @param customerEmail - Customer email address
   * @returns Array of policies
   */
  async findByCustomerEmail(customerEmail: string): Promise<Policy[]> {
    try {
      return await this.db
        .select()
        .from(policies)
        .where(
          and(
            eq(policies.customerEmail, customerEmail),
            isNull(policies.deletedAt)
          )
        )
        .orderBy(desc(policies.createdAt));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find policy by chain ID
   * @param policyChainId - Policy chain ID
   * @returns Policy or null if not found
   */
  async findPolicyByChainId(policyChainId: string): Promise<Policy | null> {
    try {
      const [policy] = await this.db
        .select()
        .from(policies)
        .where(
          and(
            eq(policies.policyChainId, policyChainId),
            isNull(policies.deletedAt)
          )
        )
        .limit(1);

      return policy || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new policy
   * @param policyData - Policy data
   * @returns Created policy
   */
  async createPolicy(policyData: NewPolicy): Promise<Policy> {
    try {
      const result = await this.db
        .insert(policies)
        .values(policyData);

      const insertResult = result[0] as any;
      const newPolicy = await this.db
        .select()
        .from(policies)
        .where(eq(policies.id, insertResult.insertId))
        .limit(1);

      return newPolicy[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new policy term
   * @param termData - Policy term data
   * @returns Created policy term
   */
  async createPolicyTerm(termData: NewPolicyTerm): Promise<PolicyTerm> {
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

  /**
   * Get complete policy data with all terms
   * @param policyId - Policy ID
   * @returns Complete policy data or null
   */
  async getCompletePolicy(policyId: number): Promise<CompletePolicy | null> {
    try {
      const [policy] = await this.db
        .select()
        .from(policies)
        .where(
          and(
            eq(policies.id, policyId),
            isNull(policies.deletedAt)
          )
        )
        .limit(1);

      if (!policy) return null;

      // Get all terms for this policy
      const terms = await this.db
        .select()
        .from(policyTerms)
        .where(
          and(
            eq(policyTerms.policyId, policyId),
            isNull(policyTerms.deletedAt)
          )
        )
        .orderBy(desc(policyTerms.effectiveDate));

      return {
        ...policy,
        policyTerms: terms,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find complete policies by customer email with all terms
   * @param customerEmail - Customer email address
   * @returns Array of complete policies
   */
  async findCompletePoliciesByCustomerEmail(customerEmail: string): Promise<CompletePolicy[]> {
    try {
      // Get all policies for the customer
      const policyList = await this.db
        .select()
        .from(policies)
        .where(
          and(
            eq(policies.customerEmail, customerEmail),
            isNull(policies.deletedAt)
          )
        )
        .orderBy(desc(policies.createdAt));

      if (!policyList || policyList.length === 0) {
        return [];
      }

      // Get complete policy data for each policy
      const completePolicies: CompletePolicy[] = [];
      
      for (const policy of policyList) {
        const completePolicy = await this.getCompletePolicy(policy.id);
        if (completePolicy) {
          completePolicies.push(completePolicy);
        }
      }

      return completePolicies;
    } catch (error) {
      throw error;
    }
  }
} 