/**
 * get-policies.usecase.spec.ts
 * Author: Insurance Portal Development Team
 * Description: Tests for GetPoliciesUseCase following TDD principles
 * Module: Insurance Property Portal Backend
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetPoliciesUseCase } from './get-policies.usecase';
import { PropertyRepository } from '@app/db';
import { UserContextService } from '@app/user-context';
import { Logger } from '@app/logger';
import { GetPoliciesQueryDto, PropertyResponseDto } from '../../dto/get-policies.dto';

describe('GetPoliciesUseCase', () => {
  let useCase: GetPoliciesUseCase;
  let propertyRepository: jest.Mocked<PropertyRepository>;
  let userContextService: jest.Mocked<UserContextService>;
  let logger: jest.Mocked<Logger>;

  const mockUserContext = {
    userId: 1,
    email: 'test@proper.insure',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER',
    isStaff: false,
    mobileNumber: '+1234567890',
    cognitoKey: 'cognito-key-123',
    cognitoUsername: 'john.doe',
    isActive: true,
    preferredName: 'John',
    pronoun: 'he/him',
    lastLoggedIn: new Date(),
    federatedProviderType: 'cognito',
  };

  const mockProperty = {
    id: 1,
    userId: 1,
    name: 'Commercial Property',
    type: 'COMMERCIAL',
    address: '123 Business Ave, Commerce City, CA 90210',
    policyNumber: 'POL-12345-6789',
    effectiveDate: new Date('2024-01-15'),
    expirationDate: new Date('2025-01-15'),
    coverageAmount: '1500000.10',
    deductible: '5000.20',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system',
    deletedAt: null,
    deletedBy: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPoliciesUseCase,
        {
          provide: PropertyRepository,
          useValue: {
            findPropertiesWithFilters: jest.fn(),
          },
        },
        {
          provide: UserContextService,
          useValue: {
            getUserContext: jest.fn(),
            getUserId: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: {
            debug: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetPoliciesUseCase>(GetPoliciesUseCase);
    propertyRepository = module.get(PropertyRepository) as jest.Mocked<PropertyRepository>;
    userContextService = module.get(UserContextService) as jest.Mocked<UserContextService>;
    logger = module.get(Logger) as jest.Mocked<Logger>;
  });

  describe('execute', () => {
    const mockQuery: GetPoliciesQueryDto = {
      page: 1,
      limit: 10,
      type: 'COMMERCIAL',
      status: 'ACTIVE',
      search: 'property',
    };

    it('should retrieve policies successfully for authenticated user', async () => {
      // Arrange
      userContextService.getUserContext.mockReturnValue(mockUserContext);
      propertyRepository.findPropertiesWithFilters.mockResolvedValue({
        data: [mockProperty],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      // Act
      const result = await useCase.execute(mockQuery);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '1',
        name: 'Commercial Property',
        type: 'COMMERCIAL',
        address: '123 Business Ave, Commerce City, CA 90210',
        policy: {
          number: 'POL-12345-6789',
          effectiveDate: mockProperty.effectiveDate.toString(),
          expirationDate: mockProperty.expirationDate.toString(),
          coverageAmount: 1500000.10,
          deductible: 5000.20,
          status: 'ACTIVE',
        },
      });

      expect(propertyRepository.findPropertiesWithFilters).toHaveBeenCalledWith(
        {
          userId: 1,
          type: 'COMMERCIAL',
          status: 'ACTIVE',
          search: 'property',
        },
        {
          page: 1,
          limit: 10,
          orderBy: 'id',
          orderDirection: 'desc',
        },
      );
    });

    it('should throw NotFoundException when user ID is invalid', async () => {
      // Arrange
      userContextService.getUserContext.mockReturnValue({
        ...mockUserContext,
        userId: 0,
      });

      // Act & Assert
      await expect(useCase.execute(mockQuery)).rejects.toThrow(NotFoundException);
      expect(logger.error).toHaveBeenCalledWith(
        'GetPoliciesUseCase: Invalid user ID',
        { userId: 0 },
      );
    });

    it('should use default pagination when not provided', async () => {
      // Arrange
      userContextService.getUserContext.mockReturnValue(mockUserContext);
      propertyRepository.findPropertiesWithFilters.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      const queryWithoutPagination: GetPoliciesQueryDto = {
        type: 'COMMERCIAL',
      };

      // Act
      await useCase.execute(queryWithoutPagination);

      // Assert
      expect(propertyRepository.findPropertiesWithFilters).toHaveBeenCalledWith(
        {
          userId: 1,
          type: 'COMMERCIAL',
          status: undefined,
          search: undefined,
        },
        {
          page: 1,
          limit: 10,
          orderBy: 'id',
          orderDirection: 'desc',
        },
      );
    });

    it('should handle empty results gracefully', async () => {
      // Arrange
      userContextService.getUserContext.mockReturnValue(mockUserContext);
      propertyRepository.findPropertiesWithFilters.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      // Act
      const result = await useCase.execute(mockQuery);

      // Assert
      expect(result).toEqual([]);
      expect(logger.debug).toHaveBeenCalledWith(
        'GetPoliciesUseCase: Successfully retrieved properties',
        {
          userId: 1,
          count: 0,
          total: 0,
        },
      );
    });

    it('should handle database errors and throw generic error', async () => {
      // Arrange
      userContextService.getUserContext.mockReturnValue(mockUserContext);
      userContextService.getUserId.mockReturnValue(1);
      propertyRepository.findPropertiesWithFilters.mockRejectedValue(
        new Error('Database connection error'),
      );

      // Act & Assert
      await expect(useCase.execute(mockQuery)).rejects.toThrow(
        'Failed to retrieve policies information',
      );
      expect(logger.error).toHaveBeenCalledWith(
        'GetPoliciesUseCase: Error retrieving policies',
        expect.objectContaining({
          error: 'Database connection error',
          userId: 1,
          query: mockQuery,
        }),
      );
    });
  });
}); 