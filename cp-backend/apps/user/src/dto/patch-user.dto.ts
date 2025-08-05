/**
 * patch-user.dto.ts
 * Author: Sujeban Elankeswaran
 * Description: DTOs for patching user details.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class PatchUserDto {
  @ApiPropertyOptional({ description: 'First name of the user' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name of the user' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Mobile number of the user' })
  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @ApiPropertyOptional({ description: 'Preferred name of the user' })
  @IsOptional()
  @IsString()
  preferredName?: string;

  @ApiPropertyOptional({ description: 'Pronoun of the user' })
  @IsOptional()
  @IsString()
  pronoun?: string;

  @ApiPropertyOptional({
    description: 'Indicates if onboarding is complete for the user',
  })
  @IsOptional()
  @IsBoolean()
  isOnboardingComplete?: boolean;
}

export class PatchUserResponseDto {
  @ApiPropertyOptional({ description: 'ID of the user' })
  id: number;

  @ApiPropertyOptional({ description: 'First name of the user' })
  firstName: string;

  @ApiPropertyOptional({ description: 'Last name of the user' })
  lastName: string;

  @ApiPropertyOptional({ description: 'Mobile number of the user' })
  mobileNumber: string;

  @ApiPropertyOptional({ description: 'Preferred name of the user' })
  preferredName: string;

  @ApiPropertyOptional({ description: 'Pronoun of the user' })
  pronoun: string;

  @ApiPropertyOptional({ description: 'Indicates if onboarding is complete' })
  isOnboardingComplete: boolean;

  @ApiPropertyOptional({ description: 'Email of the user' })
  email: string;
}
