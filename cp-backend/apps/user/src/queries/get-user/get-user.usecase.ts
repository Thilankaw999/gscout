/**
 * get-user.usecase.ts
 * Author: Insurance Portal Development Team
 * Description: Retrieves user profile information for insurance portal
 * Module: Insurance Property Portal Backend
 */

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UseCase } from '@app/common';
import { UserRepository } from '@app/db';
import { CustomerProfileResponseDto } from '../../dto/customer-profile.dto';
import { UserContextService } from '@app/user-context';
import { Logger } from '@app/logger';

@Injectable()
export class GetUserUseCase extends UseCase<void, CustomerProfileResponseDto> {
  constructor(
    private readonly userContextService: UserContextService,
    private readonly userRepository: UserRepository,
    private readonly logger: Logger,
  ) {
    super();
  }

  async execute(): Promise<CustomerProfileResponseDto> {
    try {
      // Get user context from the request (populated by middleware)
      const userContext = this.userContextService.getUserContext();
      const { userId, cognitoKey } = userContext;

      this.logger.debug('GetUserUseCase: Starting user profile retrieval', {
        userId,
        cognitoKey: cognitoKey ? '***' : undefined,
      });

      // Validate that we have a valid user ID
      if (!userId || userId <= 0) {
        this.logger.error('GetUserUseCase: Invalid user ID', { userId });
        throw new UnauthorizedException('Invalid user context');
      }

      // Fetch user from database
      const user = await this.userRepository.findById(userId);

      if (!user) {
        this.logger.error('GetUserUseCase: User not found', {
          userId,
          cognitoKey: cognitoKey ? '***' : undefined,
        });
        throw new NotFoundException('User not found');
      }

      // Validate that the user is active
      if (user.isActive !== 1) {
        this.logger.warn('GetUserUseCase: User is inactive', {
          userId,
          isActive: user.isActive,
        });
        throw new UnauthorizedException('User account is inactive');
      }

      this.logger.debug('GetUserUseCase: Successfully retrieved user profile', {
        userId,
        email: user.email,
      });

      // Return the user data in the expected API format
      // Note: Address data is mocked since it's not in the user table
      return {
        code: 200,
        message: 'User profile data retrieved successfully',
        data: {
          profilePictureUrl: 'https://abc/profile-picture.jpg', // Mock data as per API docs
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.mobileNumber || '',
          address: {
            // Mock address data as per API documentation
            line1: '3183 Orthello Way',
            line2: '',
            city: 'Santa Clara',
            state: 'CA',
            postalCode: '95051',
            country: 'USA',
          },
        },
      };
    } catch (error) {
      this.logger.error('GetUserUseCase: Error retrieving user profile', {
        error: error.message,
        stack: error.stack,
        userId: this.userContextService.getUserId(),
      });

      // Re-throw the error if it's already a known exception
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      // For database or other unexpected errors, throw a generic error
      throw new Error('Failed to retrieve user profile information');
    }
  }
}
