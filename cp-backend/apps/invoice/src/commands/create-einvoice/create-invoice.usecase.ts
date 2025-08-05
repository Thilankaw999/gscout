/**
 * Author: Sujeban Elankeswaran (sujeban.elankeswaran@mitrai.com)
 * Created on: 11/12/2024
 * Description: CreateInvoiceUseCase using Drizzle ORM
 * Module: LiPMPS Backend
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { UseCase } from '@app/common';
import {
  CreateInvoiceDto,
  CreateInvoiceResponseDto,
} from '../../dto/create-invoice.dto';
import { Logger } from '@app/logger';
import { UserContextService } from '@app/user-context';
import { InvoiceRepository } from '@app/db';

@Injectable()
export class CreateInvoiceUseCase extends UseCase<
  CreateInvoiceDto,
  CreateInvoiceResponseDto
> {
  constructor(
    private readonly logger: Logger,
    private readonly userContextService: UserContextService,
    private readonly invoiceRepository: InvoiceRepository,
  ) {
    super();
  }

  async execute(
    createInvoiceDto: CreateInvoiceDto,
  ): Promise<CreateInvoiceResponseDto> {
    try {
      const cognitoKey = this.userContextService.getCognitoKey();
      this.logger.info('CreateInvoiceUseCase: Creating invoice', {
        invoiceId: createInvoiceDto.invoiceId,
        invoiceNumber: createInvoiceDto.invoiceNumber,
        cognitoKey: cognitoKey ? '***' : undefined,
      });

      // Validate input data
      this.validateInvoiceData(createInvoiceDto);

      // Check if invoice already exists
      const existingInvoice = await this.invoiceRepository.findByInvoiceKey(
        createInvoiceDto.invoiceId,
      );
      if (existingInvoice) {
        this.logger.warn('CreateInvoiceUseCase: Invoice already exists', {
          invoiceId: createInvoiceDto.invoiceId,
          cognitoKey: cognitoKey ? '***' : undefined,
        });
        throw new BadRequestException('Invoice already exists');
      }

      // Calculate totals from claims
      const { totalAmount } = this.calculateTotals(createInvoiceDto.claims);

      // Prepare invoice data for database
      const invoiceData = {
        invoiceKey: createInvoiceDto.invoiceId,
        invoiceNumber: createInvoiceDto.invoiceNumber,
        memberId: createInvoiceDto.member.hhMemberKey
          ? parseInt(createInvoiceDto.member.hhMemberKey)
          : null,
        providerAccountId: createInvoiceDto.bankAccount,
        providerId: null, // Would be resolved from bank account in real implementation
        state: 'DRAFT',
        invoiceTotal: totalAmount.toFixed(2),
        fundedTotal: '0.00',
        paidTotal: '0.00',
        invoiceDate: new Date(createInvoiceDto.invoiceDate),
        receivedDate: new Date(),
        source: 'system',
        createdBy: cognitoKey || 'system',
        updatedBy: cognitoKey || 'system',
      };
      // Create invoice in database
      const createdInvoice = await this.invoiceRepository.create({
        ...invoiceData,
        providerAccountId: parseInt(invoiceData.providerAccountId),
      });

      this.logger.info('CreateInvoiceUseCase: Invoice created successfully', {
        invoiceId: createdInvoice.invoiceKey,
        invoiceNumber: createdInvoice.invoiceNumber,
        totalAmount: createdInvoice.invoiceTotal,
      });

      return {
        invoiceKey: createdInvoice.invoiceKey,
      };
    } catch (error) {
      this.logger.error('CreateInvoiceUseCase: Error creating invoice', {
        error: error.message,
        stack: error.stack,
        invoiceId: createInvoiceDto.invoiceId,
        cognitoKey: this.userContextService.getCognitoKey() ? '***' : undefined,
      });

      // Re-throw the error if it's already a known exception
      if (error instanceof BadRequestException) {
        throw error;
      }

      // For database or other unexpected errors, throw a generic error
      throw new Error('Failed to create invoice');
    }
  }

  private validateInvoiceData(createInvoiceDto: CreateInvoiceDto): void {
    // Validate invoice date
    const invoiceDate = new Date(createInvoiceDto.invoiceDate);
    if (isNaN(invoiceDate.getTime())) {
      throw new BadRequestException('Invalid invoice date');
    }

    // Validate claims
    if (!createInvoiceDto.claims || createInvoiceDto.claims.length === 0) {
      throw new BadRequestException('Invoice must have at least one claim');
    }

    // Validate each claim
    createInvoiceDto.claims.forEach((claim, index) => {
      if (!claim.claimId) {
        throw new BadRequestException(
          `Claim ${index + 1} must have a claim ID`,
        );
      }

      if (!claim.servicePeriod.start) {
        throw new BadRequestException(
          `Claim ${index + 1} must have a service start date`,
        );
      }

      if (claim.quantity <= 0) {
        throw new BadRequestException(
          `Claim ${index + 1} must have a positive quantity`,
        );
      }

      if (claim.unitPrice <= 0) {
        throw new BadRequestException(
          `Claim ${index + 1} must have a positive unit price`,
        );
      }

      // Validate service period dates
      const startDate = new Date(claim.servicePeriod.start);
      if (isNaN(startDate.getTime())) {
        throw new BadRequestException(
          `Claim ${index + 1} has invalid service start date`,
        );
      }

      if (claim.servicePeriod.end) {
        const endDate = new Date(claim.servicePeriod.end);
        if (isNaN(endDate.getTime())) {
          throw new BadRequestException(
            `Claim ${index + 1} has invalid service end date`,
          );
        }

        if (endDate < startDate) {
          throw new BadRequestException(
            `Claim ${index + 1} service end date must be after start date`,
          );
        }
      }
    });
  }

  private calculateTotals(claims: any[]): {
    totalAmount: number;
    totalQuantity: number;
  } {
    let totalAmount = 0;
    let totalQuantity = 0;

    claims.forEach((claim) => {
      const claimTotal = claim.quantity * claim.unitPrice;
      totalAmount += claimTotal;
      totalQuantity += claim.quantity;
    });

    return { totalAmount, totalQuantity };
  }
}
