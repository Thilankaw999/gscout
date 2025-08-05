/**
 * get-claims.usecase.spec.ts
 * Author: Insurance Portal Development Team
 * Description: Unit tests for GetClaimsUseCase
 * Module: Insurance Property Portal Backend
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetClaimsUseCase } from './get-claims.usecase';
import { ClaimRepository } from '@app/db';
import { UserContextService } from '@app/user-context';
import { Logger } from '@app/logger';
import { GetClaimsQueryDto } from '../../dto/get-claims.dto';

describe('GetClaimsUseCase', () => {
  let useCase: GetClaimsUseCase;
  let claimRepository: jest.Mocked<ClaimRepository>;
  let userContextService: jest.Mocked<UserContextService>;
  let logger: jest.Mocked<Logger>;

  const mockUserContext = {
    userId: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'customer',
    isStaff: false,
    mobileNumber: '+1234567890',
    cognitoKey: 'test-cognito-key',
    cognitoUsername: 'johndoe',
    isActive: true,
    preferredName: 'John',
    pronoun: 'he/him',
    lastLoggedIn: new Date(),
    federatedProviderType: 'cognito',
  };

  const mockClaimsData = [
    {
      id: 1,
      userId: 1,
      propertyId: 1,
      number: 'CLM-98765-4321',
      damageType: 'WATER_DAMAGE',
      dateOfLoss: new Date('2024-03-05'),
      progress: 'Adjuster Review',
      address: '123 Business Ave, Commerce City, CA 90210',
      estimatedDamage: '25000.00',
      lastUpdated: new Date('2024-03-10'),
      adjusterName: 'John Smith',
      estimatedResolutionDate: new Date('2025-07-30'),
      description: 'Water damage claim',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      updatedBy: 'system',
      deletedAt: new Date(),
      deletedBy: 'system',
    },
  ];

  const mockRepositoryResult = {
    data: mockClaimsData,
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  beforeEach(async () => {
    const mockClaimRepository = {
      findClaimsWithFilters: jest.fn(),
    };

    const mockUserContextService = {
      getUserContext: jest.fn(),
      getUserId: jest.fn(),
      getEmail: jest.fn(),
    };

    const mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetClaimsUseCase,
        { provide: ClaimRepository, useValue: mockClaimRepository },
        { provide: UserContextService, useValue: mockUserContextService },
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    useCase = module.get<GetClaimsUseCase>(GetClaimsUseCase);
    claimRepository = module.get(ClaimRepository);
    userContextService = module.get(UserContextService);
    logger = module.get(Logger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should successfully retrieve claims for authenticated user', async () => {
      // Arrange
      const query: GetClaimsQueryDto = {
        page: 1,
        limit: 10,
      };

      userContextService.getUserContext.mockReturnValue(mockUserContext);
      claimRepository.findClaimsWithFilters.mockResolvedValue(mockRepositoryResult);

      // Act
      const result = await useCase.execute(query);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '1',
        number: 'CLM-98765-4321',
        damageType: 'WATER_DAMAGE',
        dateOfLoss: mockClaimsData[0].dateOfLoss.toString(),
        progress: 'Adjuster Review',
        address: '123 Business Ave, Commerce City, CA 90210',
        estimatedDamage: 25000,
        lastUpdated: mockClaimsData[0].lastUpdated.toISOString(),
        adjusterName: 'John Smith',
        estimatedResolutionDate: mockClaimsData[0].estimatedResolutionDate?.toString(),
      });

      expect(claimRepository.findClaimsWithFilters).toHaveBeenCalledWith(
        {
          userId: 1,
          damageType: undefined,
          progress: undefined,
          dateOfLossFrom: undefined,
          dateOfLossTo: undefined,
          search: undefined,
        },
        {
          page: 1,
          limit: 10,
          orderBy: 'lastUpdated',
          orderDirection: 'desc',
        },
      );

      expect(logger.debug).toHaveBeenCalledWith(
        'GetClaimsUseCase: Starting claims retrieval',
        expect.objectContaining({
          userId: 1,
          query,
        }),
      );
    });

    it('should apply filters correctly when provided', async () => {
      // Arrange
      const query: GetClaimsQueryDto = {
        page: 2,
        limit: 5,
        damageType: 'FIRE_DAMAGE',
        progress: 'In Progress',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        search: 'test search',
      };

      userContextService.getUserContext.mockReturnValue(mockUserContext);
      claimRepository.findClaimsWithFilters.mockResolvedValue({
        ...mockRepositoryResult,
        data: [],
        total: 0,
      });

      // Act
      await useCase.execute(query);

      // Assert
      expect(claimRepository.findClaimsWithFilters).toHaveBeenCalledWith(
        {
          userId: 1,
          damageType: 'FIRE_DAMAGE',
          progress: 'In Progress',
          dateOfLossFrom: new Date('2024-01-01'),
          dateOfLossTo: new Date('2024-12-31'),
          search: 'test search',
        },
        {
          page: 2,
          limit: 5,
          orderBy: 'lastUpdated',
          orderDirection: 'desc',
        },
      );
    });

    it('should handle invalid user ID', async () => {
      // Arrange
      const query: GetClaimsQueryDto = { page: 1, limit: 10 };
      
      userContextService.getUserContext.mockReturnValue({
        ...mockUserContext,
        userId: 0,
      });
      userContextService.getUserId.mockReturnValue(0);

      // Act & Assert
      await expect(useCase.execute(query)).rejects.toThrow(NotFoundException);
      
      expect(logger.error).toHaveBeenCalledWith(
        'GetClaimsUseCase: Invalid user ID',
        { userId: 0 },
      );
    });

    it('should handle empty results', async () => {
      // Arrange
      const query: GetClaimsQueryDto = { page: 1, limit: 10 };

      userContextService.getUserContext.mockReturnValue(mockUserContext);
      claimRepository.findClaimsWithFilters.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      // Act
      const result = await useCase.execute(query);

      // Assert
      expect(result).toEqual([]);
      expect(logger.debug).toHaveBeenCalledWith(
        'GetClaimsUseCase: Successfully retrieved claims',
        expect.objectContaining({
          userId: 1,
          count: 0,
          total: 0,
        }),
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      const query: GetClaimsQueryDto = { page: 1, limit: 10 };
      const repositoryError = new Error('Database connection failed');

      userContextService.getUserContext.mockReturnValue(mockUserContext);
      userContextService.getUserId.mockReturnValue(1);
      claimRepository.findClaimsWithFilters.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(useCase.execute(query)).rejects.toThrow('Failed to retrieve claims information');

      expect(logger.error).toHaveBeenCalledWith(
        'GetClaimsUseCase: Error retrieving claims',
        expect.objectContaining({
          error: 'Database connection failed',
          userId: 1,
          query,
        }),
      );
    });
  });
}); 