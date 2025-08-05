/**
 * get-user.dto.ts
 * Author: Sujeban Elankeswaran
 * Description: DTOs for retrieving and representing user context data in GetUserUseCase.
 * Module: LiSLS Boilerplate
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Represents the provider information in the user context.
 */
export class ProviderInfoDto {
  @ApiProperty({
    example: 123,
    description:
      'The unique identifier of the provider associated with the user.',
  })
  hhProviderId: number;

  @ApiProperty({
    example: 123,
    description: 'The unique identifier of the account.',
  })
  accountId: number;
}

/**
 * Represents the main DTO returned by GetUserUseCase.
 */
export class UserPermissionsDto {
  @ApiProperty({
    example: 123,
    description: 'The user Id of the user.',
  })
  userId: number;

  @ApiProperty({
    example: 'example@domain.com',
    description: 'The email address of the user.',
  })
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'The first name of the user.',
  })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'The last name of the user.',
  })
  lastName: string;

  @ApiProperty({
    example: 'ADMIN',
    description: 'The role of the user within the system.',
  })
  role: string;

  @ApiProperty({
    example: true,
    description: 'Indicates whether the user is staff.',
  })
  isStaff: boolean;

  @ApiProperty({
    example: '+1234567890',
    description: 'The mobile number of the user.',
  })
  mobileNumber: string;

  @ApiProperty({
    example: true,
    description: 'Indicates whether the user is currently active.',
  })
  isActive: boolean;

  @ApiProperty({
    example: 'John Doe',
    description: 'The preferred name of the user.',
  })
  preferredName: string;

  @ApiProperty({
    example: 'They/Them',
    description: 'The pronoun of the user.',
  })
  pronoun: string;

  @ApiProperty({
    example: '2024-11-14T12:34:56.789Z',
    description: 'The last login timestamp of the user.',
  })
  lastLoggedIn: Date;

  @ApiProperty({
    example: 'Google',
    description: 'The federated provider type for the user.',
  })
  federatedProviderType: string;

  @ApiProperty({
    example: ['PERMISSION_READ', 'PERMISSION_WRITE'],
    description: 'List of feature permissions associated with the user’s role.',
    type: [String],
  })
  featurePermissions: string[];
}
