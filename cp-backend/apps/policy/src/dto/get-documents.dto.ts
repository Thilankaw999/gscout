/**
 * get-documents.dto.ts
 * Author: Insurance Portal Development Team
 * Description: DTOs for Documents API endpoints
 * Module: Insurance Property Portal Backend
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';

export class DocumentResponseDto {
  @ApiProperty({ example: 'doc_xyz' })
  id: string;

  @ApiProperty({ example: 'Commercial Property Policy.pdf' })
  name: string;

  @ApiProperty({ example: 'POLICY' })
  type: string;

  @ApiProperty({ example: '2024-01-15' })
  uploadDate: string;

  @ApiProperty({ example: '/api/documents/doc_xyz/download' })
  downloadUrl: string;

  @ApiPropertyOptional({ example: 1024000 })
  fileSize?: number;

  @ApiPropertyOptional({ example: 'application/pdf' })
  contentType?: string;
}

export class GetDocumentsQueryDto {
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

  @ApiPropertyOptional({ example: 'POLICY' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsString()
  dateTo?: string;
}

export class DownloadDocumentParamsDto {
  @ApiProperty({ example: 'doc_xyz' })
  @IsString()
  documentId: string;
} 