/**
 * Author: Sujeban Elankeswaran (sujeban.elankeswaran@mitrai.com)
 * Created on: 11/12/2024
 * Description: CreateInvoice DTO - Cleaned up for Drizzle ORM
 * Module: LiPMPS Backend
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum InvoiceType {
  CLAIMING_INVOICE_SUBMITTED = 'claiming.invoice.submitted',
  CLAIMING_PREDETERMINATION_SUBMITTED = 'claiming.predetermination.submitted',
}

export class CreateInvoiceMemberDto {
  @ApiProperty({
    example: '430163333463',
    description: 'Member ID for the invoice',
  })
  @IsString()
  @IsOptional()
  hhMemberKey: string;
}

export class ServicePeriodDto {
  @ApiProperty({
    example: '2024-01-15',
    description: 'Start date of the service period',
  })
  @IsString()
  @IsNotEmpty()
  start: string;

  @ApiProperty({
    example: '2024-01-16',
    description: 'End date of the service period',
  })
  @IsString()
  @IsOptional()
  end?: string;
}

export class ClaimDto {
  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'Unique identifier for the claim',
  })
  @IsString()
  @IsNotEmpty()
  claimId: string;

  @ApiProperty({
    type: ServicePeriodDto,
    description: 'Service period for the claim',
  })
  @ValidateNested()
  @Type(() => ServicePeriodDto)
  servicePeriod: ServicePeriodDto;

  @ApiProperty({
    example: '01_001_0101_1_1',
    description: 'Support item code',
  })
  @IsString()
  @IsNotEmpty()
  itemCode: string;

  @ApiProperty({
    example:
      'Transition to NDIS funding payment of rent and utility accounts. Short term payment as per participant plan.',
    description: 'Description of the service provided',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 8.5,
    description: 'Quantity of the service provided',
  })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({
    example: 10,
    description: 'Unit price for the service',
  })
  @IsNumber()
  @IsNotEmpty()
  unitPrice: number;

  @ApiProperty({
    example: 'GST',
    description: 'Tax code for the service',
  })
  @IsString()
  @IsNotEmpty()
  taxCode: string;
}

export class CreateInvoiceDto {
  @ApiProperty({
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description: 'Unique identifier for the invoice',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description: 'Invoice ID',
  })
  @IsUUID()
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({
    example: 'INV-0000232879',
    description: 'Invoice number',
  })
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiProperty({
    example: '2024-01-23',
    description: 'Date when the invoice was issued',
  })
  @IsString()
  @IsNotEmpty()
  invoiceDate: string;

  @ApiProperty({
    enum: InvoiceType,
    description: 'Type of the invoice',
  })
  @IsEnum(InvoiceType)
  @IsNotEmpty()
  type: InvoiceType;

  @ApiProperty({
    type: CreateInvoiceMemberDto,
    description: 'Member details for the invoice',
  })
  @ValidateNested()
  @Type(() => CreateInvoiceMemberDto)
  member: CreateInvoiceMemberDto;

  @ApiProperty({
    type: [ClaimDto],
    description: 'List of claims for the invoice',
  })
  @ValidateNested({ each: true })
  @Type(() => ClaimDto)
  claims: ClaimDto[];

  @ApiProperty({
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description: 'Bank account ID for the invoice',
  })
  @IsUUID()
  @IsNotEmpty()
  bankAccount: string;
}

export class CreateInvoiceResponseDto {
  @ApiProperty({
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
    description: 'Unique identifier for the created invoice',
  })
  @IsString()
  @IsNotEmpty()
  invoiceKey: string;
}
