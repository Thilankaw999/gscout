/**
 * patch-user.usecase.ts
 * Author: Sujeban Elankeswaran
 * Created on: 23/10/2024
 * Description: Updates selected fields (firstName, lastName, mobileNumber, preferredName, pronoun) using the new Drizzle-based DB module.
 * Module: LiSLS Boilerplate
 */

import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Logger } from '@app/logger';
import { UseCase } from '@app/common';
import { UserRepository } from '@app/db';
import { PatchUserDto, PatchUserResponseDto } from '../../dto/patch-user.dto';
import { UserContextService } from '@app/user-context';

@Injectable()
export class PatchUserUseCase extends UseCase<
  PatchUserDto,
  PatchUserResponseDto
> {
  constructor(
    private readonly logger: Logger,
    private readonly userContextService: UserContextService,
    private readonly userRepository: UserRepository,
  ) {
    super();
  }

  async execute(patchUserDto: PatchUserDto): Promise<PatchUserResponseDto> {
    try {
      const cognitoKey = this.userContextService.getCognitoKey();
      const userId = this.userContextService.getUserId();

      this.logger.info('PatchUserUseCase: Starting user patch process', {
        userId,
        cognitoKey: cognitoKey ? '***' : undefined,
        patchUserDto,
      });

      // Validate that we have a valid user ID
      if (!userId || userId <= 0) {
        this.logger.error('PatchUserUseCase: Invalid user ID', { userId });
        throw new UnauthorizedException('Invalid user context');
      }

      // Fetch the current user to validate they exist and are active
      const currentUser = await this.userRepository.findById(userId);

      if (!currentUser) {
        this.logger.error('PatchUserUseCase: User not found in database', {
          userId,
          cognitoKey: cognitoKey ? '***' : undefined,
        });
        throw new NotFoundException('User not found');
      }

      // Validate that the user is active
      if (currentUser.isActive !== 1) {
        this.logger.warn('PatchUserUseCase: User is inactive', {
          userId,
          isActive: currentUser.isActive,
        });
        throw new UnauthorizedException('User account is inactive');
      }

      // Prepare update data with only the fields that are provided
      const updateData: any = {
        updatedBy: this.userContextService.getEmail() || 'system',
      };

      if (patchUserDto.firstName !== undefined) {
        updateData.firstName = patchUserDto.firstName;
      }

      if (patchUserDto.lastName !== undefined) {
        updateData.lastName = patchUserDto.lastName;
      }

      if (patchUserDto.mobileNumber !== undefined) {
        updateData.mobileNumber = patchUserDto.mobileNumber;
      }

      if (patchUserDto.preferredName !== undefined) {
        updateData.preferredName = patchUserDto.preferredName;
      }

      if (patchUserDto.pronoun !== undefined) {
        updateData.pronoun = patchUserDto.pronoun;
      }

      // Update the user in the database
      const updatedUser = await this.userRepository.update(userId, updateData);

      if (!updatedUser) {
        this.logger.error('PatchUserUseCase: Failed to update user', {
          userId,
          updateData,
        });
        throw new Error('Failed to update user');
      }

      this.logger.info('PatchUserUseCase: Successfully updated user', {
        userId: updatedUser.id,
        email: updatedUser.email,
        updatedFields: Object.keys(updateData).filter(
          (key) => key !== 'updatedBy',
        ),
      });

      // Return the updated user data
      return {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        mobileNumber: updatedUser.mobileNumber || '',
        preferredName: updatedUser.preferredName || '',
        pronoun: updatedUser.pronoun || '',
        isOnboardingComplete: true, // This could be a separate field in the future
        email: updatedUser.email,
      };
    } catch (error) {
      this.logger.error('PatchUserUseCase: Error updating user', {
        error: error.message,
        stack: error.stack,
        userId: this.userContextService.getUserId(),
        patchUserDto,
      });

      // Re-throw the error if it's already a known exception
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      // For database or other unexpected errors, throw a generic error
      throw new Error('Failed to update user information');
    }
  }
}
