/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: GetInvoiceDtos - Cleaned up for Drizzle ORM
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StateDto {
  @ApiProperty({
    example: 'Pending Approval',
    description: 'Display name of the invoice state.',
  })
  displayName: string;

  @ApiProperty({
    example: 'PENDING_APPROVAL',
    description: 'The value representing the invoice state.',
  })
  value: string;

  @ApiProperty({
    example: 'warning',
    description: 'Color code for the invoice state.',
  })
  colorCode: string;
}

export class ProviderDto {
  @ApiProperty({
    example: '077199',
    description: 'The BSB (Bank State Branch) number of the provider.',
  })
  bsb: string;

  @ApiProperty({
    example: 'Bednar Group',
    description: 'The name of the provider.',
  })
  providerName: string;

  @ApiProperty({
    example: '82503305442',
    description: 'Australian Business Number (ABN) of the provider.',
  })
  abn: string;

  @ApiProperty({
    example: '660934426',
    description: 'The bank account number of the provider.',
  })
  accountNumber: string;

  @ApiProperty({
    example: 'a191d48a-5a74-4b37-a2ed-4e369f04ea81',
    description: 'Unique identifier for the provider.',
  })
  providerKey: string;
}

export class MemberDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Member ID of the client',
  })
  memberKey: string;

  @ApiProperty({
    example: 'John',
    description: 'First name of the client',
  })
  firstName: string;

  @ApiProperty({
    example: 'Wick',
    description: 'Last name of the client',
  })
  lastName: string;

  @ApiProperty({
    example: 'hedgehog',
    description: 'Source of the client data',
  })
  source: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the plan is managed by MitraAi',
  })
  isPlanManagedByLeapin: boolean;
}

export class AttachmentDto {
  @ApiProperty({
    example:
      'https://your-s3-bucket.s3.amazonaws.com/INVOICE_ATTACHMENT.PDF?signedUrl=true',
    description: 'Signed URL of the attachment stored in an S3 bucket.',
  })
  url: string;

  @ApiProperty({
    example: 'INVOICE_ATTACHMENT.PDF',
    description: 'Name of the attachment file.',
  })
  name: string;

  @ApiProperty({
    example: 'application/pdf',
    description: 'Content type of the attachment.',
  })
  contentType: string;
}

export class ClaimDto {
  @ApiProperty({
    example: '735.61',
    description: 'Total amount invoiced for this claim.',
  })
  invoicedTotal: string;

  @ApiPropertyOptional({
    example: '735.61',
    description: 'Total amount funded for this claim.',
  })
  fundedTotal: string;

  @ApiPropertyOptional({
    example: '735.61',
    description: 'Total amount claimed for this claim.',
  })
  claimedTotal: string;

  @ApiPropertyOptional({
    example: '735.61',
    description: 'Total amount paid for this claim.',
  })
  paidTotal: string;

  @ApiProperty({
    example: '04_103_0136_6_1',
    description: 'The support item code for this claim.',
  })
  itemCode: string;

  @ApiProperty({
    example: '2023-12-09',
    description: 'Start date of the service provided in YYYY-MM-DD format.',
  })
  fromDate: string;

  @ApiPropertyOptional({
    example: '2023-11-16',
    description: 'End date of the service provided in YYYY-MM-DD format.',
  })
  toDate: string;

  @ApiProperty({
    example: '99743f7a-039f-4881-9796-b2cc98eddc8b',
    description: 'Unique identifier for the claim.',
  })
  claimKey: string;

  @ApiProperty({
    example: 'PENDING',
    description: 'Current state of the claim.',
  })
  state: string;
}

export class InvoiceDto {
  @ApiProperty({
    example: 'f3f44336-d32d-4e4f-81b0-df399795badd',
    description: 'Unique identifier for the invoice.',
  })
  invoiceKey: string;

  @ApiProperty({
    example: 'INV-5024071',
    description: 'Invoice number for the invoice.',
  })
  invoiceNumber: string;

  @ApiProperty({
    type: StateDto,
    description: 'Current state of the invoice.',
  })
  state: StateDto;

  @ApiPropertyOptional({
    type: ProviderDto,
    description: 'Details of the provider associated with the invoice.',
  })
  provider: ProviderDto;

  @ApiProperty({
    example: '735.61',
    description: 'Total amount invoiced.',
  })
  invoicedTotal: string;

  @ApiPropertyOptional({
    example: '735.61',
    description: 'Total amount claimed.',
  })
  claimedTotal: string;

  @ApiPropertyOptional({
    example: '735.61',
    description: 'Total amount funded.',
  })
  fundedTotal: string;

  @ApiPropertyOptional({
    example: '735.61',
    description: 'Total amount paid.',
  })
  paidTotal: string;

  @ApiPropertyOptional({
    type: MemberDto,
    description: 'Details of the member associated with the invoice.',
  })
  member: MemberDto;

  @ApiPropertyOptional({
    type: AttachmentDto,
    description: 'Attachment related to the invoice.',
  })
  attachment: AttachmentDto;

  @ApiPropertyOptional({
    type: [ClaimDto],
    description: 'List of claims associated with the invoice.',
  })
  claims: ClaimDto[];

  @ApiPropertyOptional({
    example: '2024-02-15',
    description: 'Date when the invoice was issued in YYYY-MM-DD format.',
  })
  invoiceDate: string;

  @ApiProperty({
    example: '2024-06-07T17:50:33.582Z',
    description: 'Date when the invoice was received in YYYY-MM-DD format.',
  })
  receivedDate: string;

  @ApiPropertyOptional({
    example: '2024-10-23',
    description: 'Due date for the invoice in YYYY-MM-DD format.',
  })
  dueDate: string;

  @ApiProperty({
    example: false,
    description: 'Indicates whether the invoice details are masked or not',
  })
  isPending: boolean;

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
