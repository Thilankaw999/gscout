/**
 * get-policies.usecase.ts
 * Author: Insurance Portal Development Team
 * Description: Retrieves policies/properties for the authenticated user
 * Module: Insurance Property Portal Backend
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { UseCase } from '@app/common';
import { PropertyRepository } from '@app/db';
import { UserContextService } from '@app/user-context';
import { Logger } from '@app/logger';
import { GetPoliciesQueryDto, PropertyResponseDto } from '../../dto/get-policies.dto';

@Injectable()
export class GetPoliciesUseCase extends UseCase<GetPoliciesQueryDto, PropertyResponseDto[]> {
  constructor(
    private readonly userContextService: UserContextService,
    private readonly propertyRepository: PropertyRepository,
    private readonly logger: Logger,
  ) {
    super();
  }

  async execute(query: GetPoliciesQueryDto): Promise<PropertyResponseDto[]> {
    try {
      // Get user context from the request (populated by middleware)
      const userContext = this.userContextService.getUserContext();
      const { userId } = userContext;

      this.logger.debug('GetPoliciesUseCase: Starting policies retrieval', {
        userId,
        query,
      });

      // Validate that we have a valid user ID
      if (!userId || userId <= 0) {
        this.logger.error('GetPoliciesUseCase: Invalid user ID', { userId });
        throw new NotFoundException('Invalid user context');
      }

      // Prepare filters for property repository
      const filters = {
        userId,
        type: query.type,
        status: query.status,
        search: query.search,
      };

      // Prepare pagination options
      const pagination = {
        page: query.page || 1,
        limit: query.limit || 10,
        orderBy: 'id',
        orderDirection: 'desc' as const,
      };

      // Fetch properties with filters and pagination
      const result = await this.propertyRepository.findPropertiesWithFilters(
        filters,
        pagination,
      );

      this.logger.debug('GetPoliciesUseCase: Successfully retrieved properties', {
        userId,
        count: result.data.length,
        total: result.total,
      });

      // Transform properties to PropertyResponseDto format
      const properties: PropertyResponseDto[] = result.data.map((property) => ({
        id: property.id.toString(),
        name: property.name,
        type: property.type,
        address: property.address,
        policy: {
          number: property.policyNumber || '',
          effectiveDate: property.effectiveDate?.toString() || '',
          expirationDate: property.expirationDate?.toString() || '',
          coverageAmount: parseFloat(property.coverageAmount?.toString() || '0'),
          deductible: parseFloat(property.deductible?.toString() || '0'),
          status: property.status || 'UNKNOWN',
        },
      }));

      return properties;
    } catch (error) {
      this.logger.error('GetPoliciesUseCase: Error retrieving policies', {
        error: error.message,
        stack: error.stack,
        userId: this.userContextService.getUserId(),
        query,
      });

      // Re-throw the error if it's already a known exception
      if (error instanceof NotFoundException) {
        throw error;
      }

      // For database or other unexpected errors, throw a generic error
      throw new Error('Failed to retrieve policies information');
    }
  }
} 