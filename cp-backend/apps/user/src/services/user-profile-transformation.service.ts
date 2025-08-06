import { Injectable } from '@nestjs/common';
import { CustomerProfileDto } from '../dto/customer-profile.dto';

export interface ItsSystemUserProfile {
  name: string;
  email: string;
  phone: string;
  address: {
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

@Injectable()
export class UserProfileTransformationService {
  /**
   * Transform ITS System user profile to API response format
   * @param userProfile Raw user profile data from ITS System
   * @returns Transformed customer profile
   */
  transformUserProfile(userProfile: ItsSystemUserProfile): CustomerProfileDto {
    return {
      name: userProfile.name,
      email: userProfile.email,
      phone: userProfile.phone,
      address: {
        line1: userProfile.address.address_line1,
        line2: userProfile.address.address_line2,
        city: userProfile.address.city,
        state: userProfile.address.state,
        postalCode: userProfile.address.zip,
        country: userProfile.address.country,
      },
    };
  }

  /**
   * Validate if user profile exists and is complete
   * @param userProfile Raw user profile data
   * @returns Boolean indicating if profile is valid
   */
  isValidUserProfile(userProfile: ItsSystemUserProfile): boolean {
    return !!(
      userProfile &&
      userProfile.name &&
      userProfile.email &&
      userProfile.address &&
      userProfile.address.address_line1 &&
      userProfile.address.city &&
      userProfile.address.state &&
      userProfile.address.zip &&
      userProfile.address.country
    );
  }
} 