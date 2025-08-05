/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: SearchInvoicesDtos - Cleaned up for Drizzle ORM
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { isNil } from 'lodash';

export class InvoiceSearchDto {
  @ApiProperty({
    example: 'd2c221dc-f0ad-4b4b-a0d6-d1d15896f8b5',
    description: 'Unique key for the invoice',
  })
  invoiceKey: string;

  @ApiProperty({
    example: 'INV-4320107',
    description: 'Invoice number for the invoice',
  })
  invoiceNumber: string;

  @ApiProperty({
    example: 'PENDING',
    description: 'Current state of the invoice',
  })
  state: string;

  @ApiProperty({
    example: '950.70',
    description: 'Total amount invoiced',
    nullable: true,
  })
  invoiceTotal: string | null;

  @ApiPropertyOptional({
    example: '950.70',
    description: 'Total amount funded',
    nullable: true,
  })
  fundedTotal: string | null;

  @ApiPropertyOptional({
    example: '950.70',
    description: 'Total amount paid',
    nullable: true,
  })
  paidTotal: string | null;

  @ApiPropertyOptional({
    example: 123,
    description: 'Member ID associated with the invoice',
    nullable: true,
  })
  memberId: number | null;

  @ApiPropertyOptional({
    example: 456,
    description: 'Provider ID associated with the invoice',
    nullable: true,
  })
  providerId: number | null;

  @ApiPropertyOptional({
    example: '2024-04-07',
    description: 'Date when the invoice was issued',
    nullable: true,
  })
  invoiceDate: string | null;

  @ApiPropertyOptional({
    example: '2024-06-07T17:50:33.582Z',
    description: 'Datetime when the invoice was received',
    nullable: true,
  })
  receivedDate: string | null;

  @ApiProperty({
    example: 'system',
    description: 'Source of the invoice',
  })
  source: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'When the invoice was created',
  })
  createdAt: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'When the invoice was last updated',
  })
  updatedAt: string;
}

export class PaginatedInvoicesDto {
  @ApiProperty({
    example: 100,
    description: 'Total number of invoices available',
  })
  totalItems: number;

  @ApiProperty({
    example: 10,
    description: 'Total number of pages',
  })
  totalPages: number;

  @ApiProperty({
    example: 1,
    description: 'Current page number',
  })
  currentPage: number;

  @ApiProperty({
    example: 10,
    description: 'Number of items per page',
  })
  pageSize: number;

  @ApiProperty({
    type: [InvoiceSearchDto],
    description: 'List of invoices for the current page',
  })
  items: InvoiceSearchDto[];
}

export enum INVOICE_STATES {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  ONHOLD = 'ONHOLD',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PENDING_CLAIM = 'PENDING_CLAIM',
  ALL_PAID = 'ALL_PAID',
}

export class SearchInvoicesInputDto {
  @ApiPropertyOptional({
    example: 'INV-0000232879',
    description: 'Invoice number for filtering',
  })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({
    example: 'd2c221dc-f0ad-4b4b-a0d6-d1d15896f8b5',
    description: 'Invoice key for filtering',
  })
  @IsOptional()
  @IsString()
  invoiceKey?: string;

  @ApiPropertyOptional({
    example: 123,
    description: 'Member ID for filtering',
  })
  @IsOptional()
  @IsInt()
  memberId?: number;

  @ApiPropertyOptional({
    example: 456,
    description: 'Provider ID for filtering',
  })
  @IsOptional()
  @IsInt()
  providerId?: number;

  @ApiPropertyOptional({
    type: [String],
    example: ['PENDING', 'PAID'],
    description: 'Array of invoice states for filtering',
  })
  @IsEnum(INVOICE_STATES, {
    each: true,
    message: 'Each value in invoiceStates must be a valid enum value',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? [value] : value))
  invoiceStates?: string[];

  @ApiPropertyOptional({
    example: '100.00',
    description: 'Minimum invoice amount for filtering',
  })
  @IsOptional()
  @IsString()
  amountFrom?: string;

  @ApiPropertyOptional({
    example: '1000.00',
    description: 'Maximum invoice amount for filtering',
  })
  @IsString()
  @IsOptional()
  amountTo?: string;

  @ApiPropertyOptional({
    example: '2024-01-01',
    description: 'Start date for filtering in UTC (YYYY-MM-DD format)',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dateFrom must be a valid date in YYYY-MM-DD format',
  })
  @IsString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({
    example: '2024-12-31',
    description: 'End date for filtering in UTC (YYYY-MM-DD format)',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dateTo must be a valid date in YYYY-MM-DD format',
  })
  @IsString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({
    example: 'system',
    description: 'Source of the invoice for filtering',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for pagination',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => (isNil(value) ? 1 : parseInt(value, 10)))
  page?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of items per page',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => (isNil(value) ? 10 : parseInt(value, 10)))
  pageSize?: number;

  @ApiPropertyOptional({
    example: 'DESC',
    description: 'Sort order',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'], { message: 'sortOrder must be either ASC or DESC' })
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    example: 'invoiceNumber',
    description: 'Sort by column',
  })
  @IsOptional()
  @IsIn(
    [
      'invoiceNumber',
      'state',
      'invoiceTotal',
      'fundedTotal',
      'paidTotal',
      'invoiceDate',
      'receivedDate',
      'createdAt',
      'updatedAt',
    ],
    {
      message:
        'sortBy must be one of the following values: invoiceNumber, state, invoiceTotal, fundedTotal, paidTotal, invoiceDate, receivedDate, createdAt, updatedAt',
    },
  )
  sortBy?:
    | 'invoiceNumber'
    | 'state'
    | 'invoiceTotal'
    | 'fundedTotal'
    | 'paidTotal'
    | 'invoiceDate'
    | 'receivedDate'
    | 'createdAt'
    | 'updatedAt';
}
