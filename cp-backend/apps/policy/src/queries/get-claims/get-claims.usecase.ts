/**
 * get-claims.usecase.ts
 * Author: Insurance Portal Development Team
 * Description: Retrieves claims for the authenticated user
 * Module: Insurance Property Portal Backend
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { UseCase } from '@app/common';
import { ClaimRepository } from '@app/db';
import { UserContextService } from '@app/user-context';
import { Logger } from '@app/logger';
import { GetClaimsQueryDto, ClaimResponseDto } from '../../dto/get-claims.dto';

@Injectable()
export class GetClaimsUseCase extends UseCase<GetClaimsQueryDto, ClaimResponseDto[]> {
  constructor(
    private readonly userContextService: UserContextService,
    private readonly claimRepository: ClaimRepository,
    private readonly logger: Logger,
  ) {
    super();
  }

  async execute(query: GetClaimsQueryDto): Promise<ClaimResponseDto[]> {
    try {
      // Get user context from the request (populated by middleware)
      const userContext = this.userContextService.getUserContext();
      const { userId } = userContext;

      this.logger.debug('GetClaimsUseCase: Starting claims retrieval', {
        userId,
        query,
      });

      // Validate that we have a valid user ID
      if (!userId || userId <= 0) {
        this.logger.error('GetClaimsUseCase: Invalid user ID', { userId });
        throw new NotFoundException('Invalid user context');
      }

      // Prepare filters for claim repository
      const filters = {
        userId,
        damageType: query.damageType,
        progress: query.progress,
        dateOfLossFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
        dateOfLossTo: query.dateTo ? new Date(query.dateTo) : undefined,
        search: query.search,
      };

      // Prepare pagination options
      const pagination = {
        page: query.page || 1,
        limit: query.limit || 10,
        orderBy: 'lastUpdated',
        orderDirection: 'desc' as const,
      };

      // Fetch claims with filters and pagination
      const result = await this.claimRepository.findClaimsWithFilters(
        filters,
        pagination,
      );

      this.logger.debug('GetClaimsUseCase: Successfully retrieved claims', {
        userId,
        count: result.data.length,
        total: result.total,
      });

      // Transform claims to ClaimResponseDto format
      const claims: ClaimResponseDto[] = result.data.map((claim) => ({
        id: claim.id.toString(),
        number: claim.number,
        damageType: claim.damageType,
        dateOfLoss: claim.dateOfLoss?.toString() || '',
        progress: claim.progress,
        address: claim.address,
        estimatedDamage: parseFloat(claim.estimatedDamage?.toString() || '0'),
        lastUpdated: claim.lastUpdated?.toISOString() || '',
        adjusterName: claim.adjusterName || undefined,
        estimatedResolutionDate: claim.estimatedResolutionDate?.toString() || undefined,
      }));

      return claims;
    } catch (error) {
      this.logger.error('GetClaimsUseCase: Error retrieving claims', {
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
      throw new Error('Failed to retrieve claims information');
    }
  }
} 