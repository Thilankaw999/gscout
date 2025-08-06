/**
 * customer-profile.dto.ts
 * Author: Insurance Portal Development Team
 * Description: DTOs for customer profile data matching API documentation
 * Module: Insurance Property Portal Backend
 */

import { ApiProperty } from '@nestjs/swagger';

export class AddressDto {
  @ApiProperty({ example: '3183 Orthello Way' })
  line1: string;

  @ApiProperty({ example: '', nullable: true })
  line2: string | null;

  @ApiProperty({ example: 'Santa Clara' })
  city: string;

  @ApiProperty({ example: 'CA' })
  state: string;

  @ApiProperty({ example: '95051' })
  postalCode: string;

  @ApiProperty({ example: 'USA' })
  country: string;
}

export class CustomerProfileDto {
  @ApiProperty({ example: 'Shannon Prunkl' })
  name: string;

  @ApiProperty({ example: 'shannon@proper.insure' })
  email: string;

  @ApiProperty({ example: '(443) 798-8013' })
  phone: string;

  @ApiProperty({ type: AddressDto })
  address: AddressDto;
}

export class CustomerProfileResponseDto {
  @ApiProperty({ type: CustomerProfileDto })
  data: CustomerProfileDto;
} 