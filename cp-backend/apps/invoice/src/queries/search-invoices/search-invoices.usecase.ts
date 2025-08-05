/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: SearchInvoicesUseCase using Drizzle ORM
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Injectable } from '@nestjs/common';
import { and, eq, like, gte, lte, inArray, isNull } from 'drizzle-orm';
import {
  PaginatedInvoicesDto,
  SearchInvoicesInputDto,
  InvoiceSearchDto,
} from '../../dto/search-invoices.dto';
import { UseCase } from '@app/common';
import { Logger } from '@app/logger';
import { InvoiceRepository } from '@app/db';
import { invoices } from '@app/db/schema/invoice.schema';

@Injectable()
export class SearchInvoicesUseCase extends UseCase<
  SearchInvoicesInputDto,
  PaginatedInvoicesDto
> {
  constructor(
    private readonly logger: Logger,
    private readonly invoiceRepository: InvoiceRepository,
  ) {
    super();
  }

  async execute(input: SearchInvoicesInputDto): Promise<PaginatedInvoicesDto> {
    try {
      this.logger.info('SearchInvoicesUseCase: Starting invoice search', {
        input: {
          ...input,
          // Don't log sensitive data
          invoiceKey: input.invoiceKey ? '***' : undefined,
        },
      });

      // Build the where conditions based on input filters
      const whereConditions = this.buildWhereConditions(input);

      // Build pagination options
      const paginationOptions = {
        page: input.page || 1,
        limit: input.pageSize || 10,
        orderBy: this.mapSortByToColumn(input.sortBy || 'createdAt'),
        orderDirection: (input.sortOrder || 'DESC').toLowerCase() as
          | 'asc'
          | 'desc',
      };

      // Execute the search with pagination
      const result = await this.invoiceRepository.paginate(
        paginationOptions,
        whereConditions,
      );

      // Transform the results to match the DTO structure
      const items: InvoiceSearchDto[] = result.data.map((invoice) => ({
        invoiceKey: invoice.invoiceKey || '',
        invoiceNumber: invoice.invoiceNumber,
        state: invoice.state || '',
        invoiceTotal: invoice.invoiceTotal,
        fundedTotal: invoice.fundedTotal,
        paidTotal: invoice.paidTotal,
        memberId: invoice.memberId,
        providerId: invoice.providerId,
        invoiceDate: invoice.invoiceDate?.toISOString().split('T')[0] || null,
        receivedDate: invoice.receivedDate?.toISOString() || null,
        source: invoice.source,
        createdAt: invoice.createdAt.toISOString(),
        updatedAt: invoice.updatedAt.toISOString(),
      }));

      this.logger.info('SearchInvoicesUseCase: Search completed successfully', {
        totalItems: result.total,
        totalPages: result.totalPages,
        currentPage: result.page,
        itemsCount: items.length,
      });

      return {
        items,
        totalItems: result.total,
        totalPages: result.totalPages,
        currentPage: result.page,
        pageSize: result.limit,
      };
    } catch (error) {
      this.logger.error('SearchInvoicesUseCase: Error during search', {
        error: error.message,
        stack: error.stack,
        input: {
          ...input,
          invoiceKey: input.invoiceKey ? '***' : undefined,
        },
      });

      throw new Error('Failed to search invoices');
    }
  }

  private buildWhereConditions(input: SearchInvoicesInputDto) {
    const conditions = [];

    // Invoice number filter
    if (input.invoiceNumber) {
      conditions.push(like(invoices.invoiceNumber, `%${input.invoiceNumber}%`));
    }

    // Invoice key filter
    if (input.invoiceKey) {
      conditions.push(eq(invoices.invoiceKey, input.invoiceKey));
    }

    // Member ID filter
    if (input.memberId) {
      conditions.push(eq(invoices.memberId, input.memberId));
    }

    // Provider ID filter
    if (input.providerId) {
      conditions.push(eq(invoices.providerId, input.providerId));
    }

    // Invoice states filter
    if (input.invoiceStates && input.invoiceStates.length > 0) {
      conditions.push(inArray(invoices.state, input.invoiceStates));
    }

    // Amount range filter
    if (input.amountFrom || input.amountTo) {
      const amountConditions = [];
      if (input.amountFrom) {
        amountConditions.push(gte(invoices.invoiceTotal, input.amountFrom));
      }
      if (input.amountTo) {
        amountConditions.push(lte(invoices.invoiceTotal, input.amountTo));
      }
      if (amountConditions.length > 0) {
        conditions.push(and(...amountConditions));
      }
    }

    // Date range filter (invoice date)
    if (input.dateFrom || input.dateTo) {
      const dateConditions = [];
      if (input.dateFrom) {
        dateConditions.push(
          gte(invoices.invoiceDate, new Date(input.dateFrom)),
        );
      }
      if (input.dateTo) {
        dateConditions.push(lte(invoices.invoiceDate, new Date(input.dateTo)));
      }
      if (dateConditions.length > 0) {
        conditions.push(and(...dateConditions));
      }
    }

    // Source filter
    if (input.source) {
      conditions.push(eq(invoices.source, input.source));
    }

    // Always exclude soft-deleted records
    conditions.push(isNull(invoices.deletedAt));

    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private mapSortByToColumn(sortBy: string): string {
    const sortByMap: Record<string, string> = {
      invoiceNumber: 'invoiceNumber',
      state: 'state',
      invoiceTotal: 'invoiceTotal',
      fundedTotal: 'fundedTotal',
      paidTotal: 'paidTotal',
      invoiceDate: 'invoiceDate',
      receivedDate: 'receivedDate',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    };

    return sortByMap[sortBy] || 'createdAt';
  }
}
