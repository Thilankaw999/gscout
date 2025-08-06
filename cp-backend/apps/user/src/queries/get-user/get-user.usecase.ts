/**
 * get-user.usecase.ts
 * Author: Insurance Portal Development Team
 * Description: Retrieves user profile information via ITS System client service
 * Module: Insurance Property Portal Backend
 */

import { Injectable, Scope, NotFoundException } from '@nestjs/common';
import { UseCase } from '@app/common';
import { CustomerProfileDto } from '../../dto/customer-profile.dto';
import { Logger } from '@app/logger';
import { ItsSystemClientService } from '../../services/its-client.service';
import { UserContextService } from '@app/user-context';
import { 
  UserProfileTransformationService, 
  ItsSystemUserProfile 
} from '../../services/user-profile-transformation.service';

@Injectable({ scope: Scope.REQUEST })
export class GetUserUseCase extends UseCase<void, CustomerProfileDto> {
  constructor(
    private readonly itsSystemClientService: ItsSystemClientService,
    private readonly logger: Logger,
    private readonly userContextService: UserContextService,
    private readonly userProfileTransformationService: UserProfileTransformationService,
  ) {
    super();
  }

  async execute(): Promise<CustomerProfileDto> {
    const userEmail = this.userContextService.getEmail();
    this.logUserProfileRetrievalStart(userEmail);

    const userProfile = await this.fetchUserProfile(userEmail);
    this.validateUserProfile(userProfile);
    this.logUserProfileRetrievalOutcome(userEmail, userProfile);

    return this.transformUserProfile(userProfile);
  }

  /**
   * Log the start of user profile retrieval process
   * @param userEmail User's email address
   */
  private logUserProfileRetrievalStart(userEmail: string): void {
    this.logger.debug('GetUserUseCase: Starting user profile retrieval', {
      userEmail,
    });
  }

  /**
   * Fetch user profile from ITS System client service
   * @param userEmail User's email address
   * @param authorization Authorization token
   * @returns Raw user profile data
   */
  private async fetchUserProfile(
    userEmail: string
  ): Promise<ItsSystemUserProfile> {
    this.logger.debug('GetUserUseCase: Calling ITS System user client service', {
      customerEmail: userEmail,
    });

    return this.itsSystemClientService.getUserProfile(userEmail);
  }

  /**
   * Validate the retrieved user profile
   * @param userProfile Raw user profile data
   * @throws NotFoundException if profile is invalid
   */
  private validateUserProfile(userProfile: ItsSystemUserProfile): void {
    if (!this.userProfileTransformationService.isValidUserProfile(userProfile)) {
      this.logger.error('GetUserUseCase: Invalid or incomplete user profile', { userProfile });
      throw new NotFoundException('User profile not found or incomplete');
    }
  }

  /**
   * Log the outcome of user profile retrieval
   * @param userEmail User's email address
   * @param userProfile Retrieved user profile
   */
  private logUserProfileRetrievalOutcome(
    userEmail: string, 
    userProfile: ItsSystemUserProfile
  ): void {
    this.logger.debug('GetUserUseCase: Successfully retrieved user profile from ITS System client service', {
      userEmail,
      hasProfile: true,
    });
  }

  /**
   * Transform user profile to API response format
   * @param userProfile Raw user profile data
   * @returns Transformed customer profile
   */
  private transformUserProfile(userProfile: ItsSystemUserProfile): CustomerProfileDto {
    return this.userProfileTransformationService.transformUserProfile(userProfile);
  }
}