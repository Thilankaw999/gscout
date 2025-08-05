/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: GetInvoiceUseCase using Drizzle ORM
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceDto } from '../../dto/get-invoice.dto';
import { UseCase } from '@app/common';
import { Logger } from '@app/logger';
import { UserContextService } from '@app/user-context';
import { InvoiceRepository } from '@app/db';

@Injectable()
export class GetInvoiceUseCase extends UseCase<string, InvoiceDto> {
  constructor(
    private readonly logger: Logger,
    private readonly userContextService: UserContextService,
    private readonly invoiceRepository: InvoiceRepository,
  ) {
    super();
  }

  async execute(invoiceKey: string): Promise<InvoiceDto> {
    try {
      const cognitoKey = this.userContextService.getCognitoKey();
      this.logger.info('GetInvoiceUseCase: Fetching invoice', {
        invoiceKey,
        cognitoKey: cognitoKey ? '***' : undefined,
      });

      // Fetch invoice from database using the new Drizzle repository
      const invoice = await this.invoiceRepository.findByInvoiceKey(invoiceKey);

      if (!invoice) {
        this.logger.warn('GetInvoiceUseCase: Invoice not found', {
          invoiceKey,
          cognitoKey: cognitoKey ? '***' : undefined,
        });
        throw new NotFoundException('Invoice not found');
      }

      this.logger.debug('GetInvoiceUseCase: Invoice found successfully', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      });

      return this.buildInvoiceDto(invoice);
    } catch (error) {
      this.logger.error('GetInvoiceUseCase: Error fetching invoice', {
        error: error.message,
        stack: error.stack,
        invoiceKey,
        cognitoKey: this.userContextService.getCognitoKey() ? '***' : undefined,
      });

      // Re-throw the error if it's already a known exception
      if (error instanceof NotFoundException) {
        throw error;
      }

      // For database or other unexpected errors, throw a generic error
      throw new Error('Failed to retrieve invoice');
    }
  }

  private buildInvoiceDto(invoice: any): InvoiceDto {
    return {
      invoiceKey: invoice.invoiceKey || '',
      invoiceNumber: invoice.invoiceNumber,
      state: {
        displayName: this.getStateDisplayName(invoice.state),
        value: invoice.state || '',
        colorCode: this.getStateColorCode(invoice.state),
      },
      provider: {
        bsb: '', // Would come from provider table in real implementation
        providerName: '', // Would come from provider table in real implementation
        abn: '', // Would come from provider table in real implementation
        accountNumber: '', // Would come from provider table in real implementation
        providerKey: invoice.providerId?.toString() || '',
      },
      invoicedTotal: invoice.invoiceTotal || '0.00',
      claimedTotal: null, // Would be calculated from claims in real implementation
      fundedTotal: invoice.fundedTotal || '0.00',
      paidTotal: invoice.paidTotal || '0.00',
      member: {
        memberKey: invoice.memberId?.toString() || '',
        firstName: '', // Would come from member table in real implementation
        lastName: '', // Would come from member table in real implementation
        source: 'system',
        isPlanManagedByLeapin: true,
      },
      attachment: {
        url: '', // Would come from S3 in real implementation
        name: '',
        contentType: '',
      },
      claims: [], // Would be fetched from claims table in real implementation
      invoiceDate: invoice.invoiceDate?.toISOString().split('T')[0] || '',
      receivedDate: invoice.receivedDate?.toISOString() || '',
      dueDate: null, // Would be calculated based on business rules
      isPending: this.isInvoicePending(invoice.state),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    };
  }

  private getStateDisplayName(state: string): string {
    const stateDisplayNames: Record<string, string> = {
      DRAFT: 'Draft',
      PENDING: 'Pending',
      PENDING_REVIEW: 'Pending Review',
      PENDING_CLAIM: 'Pending Claim',
      REJECTED: 'Rejected',
      PAID: 'Paid',
      ALL_PAID: 'All Paid',
      CANCELLED: 'Cancelled',
      REFUNDED: 'Refunded',
      ONHOLD: 'On Hold',
      PARTIALLY_APPROVED: 'Partially Approved',
    };

    return stateDisplayNames[state] || state || 'Unknown';
  }

  private getStateColorCode(state: string): string {
    const stateColorCodes: Record<string, string> = {
      DRAFT: 'secondary',
      PENDING: 'warning',
      PENDING_REVIEW: 'warning',
      PENDING_CLAIM: 'warning',
      REJECTED: 'danger',
      PAID: 'success',
      ALL_PAID: 'success',
      CANCELLED: 'danger',
      REFUNDED: 'info',
      ONHOLD: 'warning',
      PARTIALLY_APPROVED: 'info',
    };

    return stateColorCodes[state] || 'secondary';
  }

  private isInvoicePending(state: string): boolean {
    const pendingStates = ['PENDING', 'PENDING_REVIEW', 'PENDING_CLAIM'];
    return pendingStates.includes(state);
  }
}
