/**
 * Author: Insurance Portal Development Team
 * Created on: 2024-12-19
 * Updated on: 2024-12-19
 * Description: Policy Term Details Repository for comprehensive policy term data management
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
  policyTermDetails,
  policyDocuments,
  locations,
  buildings,
  policyTermClaims,
  PolicyTermDetail,
  NewPolicyTermDetail,
  PolicyDocument,
  NewPolicyDocument,
  Location,
  NewLocation,
  Building,
  NewBuilding,
  PolicyTermClaim,
  NewPolicyTermClaim,
  PolicyTermDetailsApiResponse
} from '../schema/policy.schema';

@Injectable()
export class PolicyTermDetailsRepository extends BaseRepository<
  typeof policyTermDetails,
  PolicyTermDetail,
  NewPolicyTermDetail
> {
  constructor(
    @Inject(DATABASE_CONNECTION)
    protected readonly db: MySql2Database,
  ) {
    super(db, policyTermDetails);
  }

  /**
   * Get comprehensive policy term details by binder number (term ID)
   * @param binderNumber - The binder number (term ID)
   * @returns Complete policy term details for API response
   */
  async getPolicyTermDetailsByBinderNumber(binderNumber: string): Promise<PolicyTermDetailsApiResponse | null> {
    try {
      // First, get the policy term and basic policy info
      const [policyTermResult] = await this.db
        .select({
          termId: policyTerms.termId,
          effectiveDate: policyTerms.effectiveDate,
          expirationDate: policyTerms.expirationDate,
          policyChainId: policies.policyChainId,
          insuredName: policies.insuredName,
          type: policies.type,
        })
        .from(policyTerms)
        .innerJoin(policies, eq(policyTerms.policyId, policies.id))
        .where(
          and(
            eq(policyTerms.termId, binderNumber),
            isNull(policyTerms.deletedAt),
            isNull(policies.deletedAt)
          )
        )
        .limit(1);

      if (!policyTermResult) {
        return null;
      }

      // Get policy term details
      const [termDetails] = await this.db
        .select()
        .from(policyTermDetails)
        .where(
          and(
            eq(policyTermDetails.termId, binderNumber),
            isNull(policyTermDetails.deletedAt)
          )
        )
        .limit(1);

      // Get documents
      const documentsResult = await this.db
        .select()
        .from(policyDocuments)
        .where(
          and(
            eq(policyDocuments.termId, binderNumber),
            isNull(policyDocuments.deletedAt)
          )
        );

      // Get locations with buildings
      const locationsResult = await this.db
        .select()
        .from(locations)
        .where(
          and(
            eq(locations.termId, binderNumber),
            isNull(locations.deletedAt)
          )
        );

      // Get buildings for all locations
      const locationIds = locationsResult.map(loc => loc.id);
      const buildingsResult = locationIds.length > 0 
        ? await this.db
            .select()
            .from(buildings)
            .where(
              and(
                eq(buildings.locationId, locationIds[0]), // This needs to be fixed for multiple locations
                isNull(buildings.deletedAt)
              )
            )
        : [];

      // Get all buildings for all locations
      const allBuildings = new Map<number, Building[]>();
      for (const location of locationsResult) {
        const locationBuildings = await this.db
          .select()
          .from(buildings)
          .where(
            and(
              eq(buildings.locationId, location.id),
              isNull(buildings.deletedAt)
            )
          );
        allBuildings.set(location.id, locationBuildings);
      }

      // Get claims
      const claimsResult = await this.db
        .select()
        .from(policyTermClaims)
        .where(
          and(
            eq(policyTermClaims.termId, binderNumber),
            isNull(policyTermClaims.deletedAt)
          )
        );

      // Build the comprehensive response
      const response: PolicyTermDetailsApiResponse = {
        binder_number: policyTermResult.termId,
        insured_name: policyTermResult.insuredName,
        type: policyTermResult.type,
        effectiveDate: policyTermResult.effectiveDate.toISOString().split('T')[0],
        expirationDate: policyTermResult.expirationDate.toISOString().split('T')[0],
        status: termDetails?.status || 'Active',
        notification: termDetails?.notification || 'Your policy needs renewal soon',
        coverageAmount: termDetails?.coverageAmount ? parseFloat(termDetails.coverageAmount.toString()) : 1500000.10,
        deductible: termDetails?.deductible ? parseFloat(termDetails.deductible.toString()) : 5000.20,
        each_occurrence_limit: termDetails?.eachOccurrenceLimit?.toString() || '1000000.00',
        total_cost_of_insurance: termDetails?.totalCostOfInsurance?.toString() || '2000000.00',
        wind_coverage: termDetails?.windCoverage || 'Include',
        terrorism_coverage: termDetails?.terrorismCoverage || 'Include',
        ordinance_or_law_coverage: termDetails?.ordinanceOrLawCoverage || 'No',
        bedbug_and_flea_coverage: termDetails?.bedbugAndFleaCoverage || 'No',
        squatters_coverage: termDetails?.squattersCoverage || 'No',
        equipment_breakdown_coverage: termDetails?.equipmentBreakdownCoverage || 'No',
        earthquake_coverage: termDetails?.earthquakeCoverage || 'No',
        cyber_liability_coverage: termDetails?.cyberLiabilityCoverage || 'No',
        employment_practices_liability_coverage: termDetails?.employmentPracticesLiabilityCoverage || 'No',
        documents: documentsResult.map(doc => ({
          id: doc.documentId,
          name: doc.name,
          type: doc.type,
          uploadDate: doc.uploadDate.toISOString().split('T')[0],
          fileSize: doc.fileSize || '2MB',
          downloadUrl: doc.downloadUrl || `/api/documents/${doc.documentId}/download`,
        })),
        locations: locationsResult.map(location => ({
          locationGUID: location.locationGUID,
          locationIntegrationGUID: location.locationIntegrationGUID,
          address_line1: location.addressLine1,
          address_line2: location.addressLine2 || '',
          city: location.city,
          state: location.state,
          zip: location.zip,
          county: location.county || '',
          county_FIPS: location.countyFIPS || '',
          condo: location.condo || 'No',
          buildings: (allBuildings.get(location.id) || []).map(building => ({
            buildingGUID: building.buildingGUID,
            name: building.name,
            squarefootage: building.squareFootage || '2000',
            year_built: building.yearBuilt || '2016',
            rebuild_value: building.rebuildValue?.toString() || '0.0000',
            building_coverage: building.buildingCoverage?.toString() || '500000.0000',
            contents_coverage: building.contentsCoverage?.toString() || '25000.0000',
            income_coverage: building.incomeCoverage?.toString() || '30000.0000',
          })),
        })),
        claims: claimsResult.map(claim => ({
          number: claim.claimNumber,
          filedDate: claim.filedDate.toISOString().split('T')[0],
          claimStatus: claim.claimStatus,
          estimatedDamage: claim.estimatedDamage ? parseFloat(claim.estimatedDamage.toString()) : 0,
        })),
      };

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create policy term details
   * @param termDetailData - Policy term detail data
   * @returns Created policy term detail
   */
  async createPolicyTermDetail(termDetailData: NewPolicyTermDetail): Promise<PolicyTermDetail> {
    try {
      const result = await this.db
        .insert(policyTermDetails)
        .values(termDetailData);

      const insertResult = result[0] as any;
      const [newDetail] = await this.db
        .select()
        .from(policyTermDetails)
        .where(eq(policyTermDetails.id, insertResult.insertId))
        .limit(1);

      return newDetail;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create document
   * @param documentData - Document data
   * @returns Created document
   */
  async createDocument(documentData: NewPolicyDocument): Promise<PolicyDocument> {
    try {
      const result = await this.db
        .insert(policyDocuments)
        .values(documentData);

      const insertResult = result[0] as any;
      const [newDocument] = await this.db
        .select()
        .from(policyDocuments)
        .where(eq(policyDocuments.id, insertResult.insertId))
        .limit(1);

      return newDocument;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create location
   * @param locationData - Location data
   * @returns Created location
   */
  async createLocation(locationData: NewLocation): Promise<Location> {
    try {
      const result = await this.db
        .insert(locations)
        .values(locationData);

      const insertResult = result[0] as any;
      const [newLocation] = await this.db
        .select()
        .from(locations)
        .where(eq(locations.id, insertResult.insertId))
        .limit(1);

      return newLocation;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create building
   * @param buildingData - Building data
   * @returns Created building
   */
  async createBuilding(buildingData: NewBuilding): Promise<Building> {
    try {
      const result = await this.db
        .insert(buildings)
        .values(buildingData);

      const insertResult = result[0] as any;
      const [newBuilding] = await this.db
        .select()
        .from(buildings)
        .where(eq(buildings.id, insertResult.insertId))
        .limit(1);

      return newBuilding;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create policy term claim
   * @param claimData - Claim data
   * @returns Created claim
   */
  async createPolicyTermClaim(claimData: NewPolicyTermClaim): Promise<PolicyTermClaim> {
    try {
      const result = await this.db
        .insert(policyTermClaims)
        .values(claimData);

      const insertResult = result[0] as any;
      const [newClaim] = await this.db
        .select()
        .from(policyTermClaims)
        .where(eq(policyTermClaims.id, insertResult.insertId))
        .limit(1);

      return newClaim;
    } catch (error) {
      throw error;
    }
  }
} 