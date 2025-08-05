/**
 * get-policies.dto.ts
 * Author: Insurance Portal Development Team
 * Description: DTOs for Policy API endpoints
 * Module: Insurance Property Portal Backend
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';

export class PolicyDto {
  @ApiProperty({ example: 'POL-12345-6789' })
  number: string;

  @ApiProperty({ example: '2024-01-15' })
  effectiveDate: string;

  @ApiProperty({ example: '2025-01-15' })
  expirationDate: string;

  @ApiProperty({ example: 1500000.10 })
  coverageAmount: number;

  @ApiProperty({ example: 5000.20 })
  deductible: number;

  @ApiProperty({ example: 'ACTIVE' })
  status: string;
}

export class PropertyResponseDto {
  @ApiProperty({ example: '123' })
  id: string;

  @ApiProperty({ example: 'Commercial Property' })
  name: string;

  @ApiProperty({ example: 'COMMERCIAL' })
  type: string;

  @ApiProperty({ example: '123 Business Ave, Commerce City, CA 90210' })
  address: string;

  @ApiProperty({ type: PolicyDto })
  @ValidateNested()
  @Type(() => PolicyDto)
  policy: PolicyDto;
}

export class GetPoliciesQueryDto {
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

  @ApiPropertyOptional({ example: 'COMMERCIAL' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'search term' })
  @IsOptional()
  @IsString()
  search?: string;
} 