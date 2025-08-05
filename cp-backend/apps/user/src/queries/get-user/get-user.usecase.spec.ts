/**
 * Author: Insurance Portal Development Team
 * Created on: 2024-12-19
 * Description: GetUserUseCase Tests for customer profile retrieval
 * Module: Insurance Property Portal Backend
 * Copyright (c) 2024 Proper Insure All rights reserved.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { GetUserUseCase } from './get-user.usecase';
import { UserRepository } from '@app/db';
import { UserContextService } from '@app/user-context';
import { Logger } from '@app/logger';

describe('GetUserUseCase', () => {
  let useCase: GetUserUseCase;
  let userRepository: jest.Mocked<UserRepository>;
  let userContextService: jest.Mocked<UserContextService>;
  let logger: jest.Mocked<Logger>;

  const mockUser = {
    id: 1,
    email: 'shannon@proper.insure',
    firstName: 'Shannon',
    lastName: 'Prunkl',
    userName: 'shannon',
    mobileNumber: '(443) 798-8013',
    tncAcceptedDate: null,
    isActive: 1,
    isStaff: 0,
    cognitoKey: 'test-cognito-key',
    isVerified: 1,
    lastLoggedIn: new Date('2024-01-01'),
    preferredName: 'Shannon',
    pronoun: 'She/Her',
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system',
    updatedBy: 'system',
    deletedAt: null,
    deletedBy: null,
  };

  const mockUserContext = {
    userId: 1,
    email: 'shannon@proper.insure',
    firstName: 'Shannon',
    lastName: 'Prunkl',
    role: 'customer',
    isStaff: false,
    mobileNumber: '(443) 798-8013',
    cognitoKey: 'test-cognito-key',
    cognitoUsername: 'shannon',
    isActive: true,
    preferredName: 'Shannon',
    pronoun: 'She/Her',
    lastLoggedIn: new Date('2024-01-01'),
    federatedProviderType: 'cognito',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserUseCase,
        {
          provide: UserRepository,
          useValue: {
            findById: jest.fn(),
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
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetUserUseCase>(GetUserUseCase);
    userRepository = module.get(UserRepository);
    userContextService = module.get(UserContextService);
    logger = module.get(Logger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should successfully retrieve user profile information', async () => {
      // Arrange
      userContextService.getUserContext.mockReturnValue(mockUserContext);
      userRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(mockUserContext.userId);
      expect(result).toEqual({
        code: 200,
        message: 'User profile data retrieved successfully',
        data: {
          profilePictureUrl: 'https://abc/profile-picture.jpg',
          firstName: 'Shannon',
          lastName: 'Prunkl',
          email: 'shannon@proper.insure',
          phone: '(443) 798-8013',
          address: {
            line1: '3183 Orthello Way',
            line2: '',
            city: 'Santa Clara',
            state: 'CA',
            postalCode: '95051',
            country: 'USA',
          },
        },
      });
    });

    it('should throw UnauthorizedException when user ID is invalid', async () => {
      // Arrange
      const invalidContext = { ...mockUserContext, userId: 0 };
      userContextService.getUserContext.mockReturnValue(invalidContext);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow(UnauthorizedException);
      expect(userRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user is not found in database', async () => {
      // Arrange
      userContextService.getUserContext.mockReturnValue(mockUserContext);
      userRepository.findById.mockResolvedValue(undefined);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow(NotFoundException);
      expect(userRepository.findById).toHaveBeenCalledWith(mockUserContext.userId);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: 0 };
      userContextService.getUserContext.mockReturnValue(mockUserContext);
      userRepository.findById.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow(UnauthorizedException);
      expect(userRepository.findById).toHaveBeenCalledWith(mockUserContext.userId);
    });

    it('should handle null/undefined mobile number gracefully', async () => {
      // Arrange
      const userWithNullPhone = { ...mockUser, mobileNumber: null };
      userContextService.getUserContext.mockReturnValue(mockUserContext);
      userRepository.findById.mockResolvedValue(userWithNullPhone);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.data.phone).toBe('');
    });

    it('should handle repository errors', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      userContextService.getUserContext.mockReturnValue(mockUserContext);
      userContextService.getUserId.mockReturnValue(1);
      userRepository.findById.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Failed to retrieve user profile information');

      expect(logger.error).toHaveBeenCalledWith(
        'GetUserUseCase: Error retrieving user profile',
        expect.objectContaining({
          error: 'Database connection failed',
          userId: 1,
        }),
      );
    });
  });
});
