/**
 * customer-profile.dto.ts
 * Author: Insurance Portal Development Team
 * Description: DTOs for customer profile data matching API documentation
 * Module: Insurance Property Portal Backend
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty({ example: '3183 Orthello Way' })
  line1: string;

  @ApiPropertyOptional({ example: '' })
  line2?: string;

  @ApiProperty({ example: 'Santa Clara' })
  city: string;

  @ApiProperty({ example: 'CA' })
  state: string;

  @ApiProperty({ example: '95051' })
  postalCode: string;

  @ApiProperty({ example: 'USA' })
  country: string;
}

export class CustomerProfileDataDto {
  @ApiPropertyOptional({ example: 'https://abc/profile-picture.jpg' })
  profilePictureUrl?: string;

  @ApiProperty({ example: 'Shannon' })
  firstName: string;

  @ApiProperty({ example: 'Prunkl' })
  lastName: string;

  @ApiProperty({ example: 'shannon@proper.insure' })
  email: string;

  @ApiProperty({ example: '(443) 798-8013' })
  phone: string;

  @ApiProperty({ type: AddressDto })
  address: AddressDto;
}

export class CustomerProfileResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: 'User profile data retrieved successfully' })
  message: string;

  @ApiProperty({ type: CustomerProfileDataDto })
  data: CustomerProfileDataDto;
} 