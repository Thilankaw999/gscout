/**
 * get-claims.dto.ts
 * Author: Insurance Portal Development Team
 * Description: DTOs for Claims API endpoints
 * Module: Insurance Property Portal Backend
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsDate, IsArray, ValidateNested } from 'class-validator';

export class ClaimResponseDto {
  @ApiProperty({ example: 'claim_987' })
  id: string;

  @ApiProperty({ example: 'CLM-98765-4321' })
  number: string;

  @ApiProperty({ example: 'WATER_DAMAGE' })
  damageType: string;

  @ApiProperty({ example: '2024-03-05' })
  dateOfLoss: string;

  @ApiProperty({ example: 'Adjuster Review' })
  progress: string;

  @ApiProperty({ example: '123 Business Ave, Commerce City, CA 90210' })
  address: string;

  @ApiProperty({ example: 25000 })
  estimatedDamage: number;

  @ApiProperty({ example: '2024-03-10' })
  lastUpdated: string;

  @ApiPropertyOptional({ example: 'John Smith' })
  adjusterName?: string;

  @ApiPropertyOptional({ example: '2025-07-30' })
  estimatedResolutionDate?: string;
}

export class GetClaimsQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @ApiPropertyOptional({ example: 'WATER_DAMAGE' })
  @IsOptional()
  @IsString()
  damageType?: string;

  @ApiPropertyOptional({ example: 'Adjuster Review' })
  @IsOptional()
  @IsString()
  progress?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ example: 'search term' })
  @IsOptional()
  @IsString()
  search?: string;
} 