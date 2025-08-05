/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 10-09-2024
 * Description: Invoice Repository using Drizzle ORM
 * Module: LiPMPS Backend
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, or, like, gte, lte, isNull, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.provider';
import { BaseRepository } from './base.repository';
import { invoices, Invoice, NewInvoice } from '../schema/invoice.schema';

@Injectable()
export class InvoiceRepository extends BaseRepository<
  typeof invoices,
  Invoice,
  NewInvoice
> {
  constructor(
    @Inject(DATABASE_CONNECTION)
    protected readonly db: MySql2Database,
  ) {
    super(db, invoices);
  }

  async findByInvoiceNumber(
    invoiceNumber: string,
  ): Promise<Invoice | undefined> {
    return await this.findOne(eq(this.table.invoiceNumber, invoiceNumber));
  }

  async findByInvoiceKey(invoiceKey: string): Promise<Invoice | undefined> {
    return await this.findOne(eq(this.table.invoiceKey, invoiceKey));
  }

  async findByMemberId(memberId: number): Promise<Invoice[]> {
    return await this.findMany(eq(this.table.memberId, memberId));
  }

  async findByProviderId(providerId: number): Promise<Invoice[]> {
    return await this.findMany(eq(this.table.providerId, providerId));
  }

  async findByProviderAccountId(providerAccountId: number): Promise<Invoice[]> {
    return await this.findMany(
      eq(this.table.providerAccountId, providerAccountId),
    );
  }

  async findByState(state: string): Promise<Invoice[]> {
    return await this.findMany(eq(this.table.state, state));
  }

  async findByInvoiceDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<Invoice[]> {
    return await this.findMany(
      and(
        gte(this.table.invoiceDate, startDate),
        lte(this.table.invoiceDate, endDate),
      ),
    );
  }

  async findByReceivedDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<Invoice[]> {
    return await this.findMany(
      and(
        gte(this.table.receivedDate, startDate),
        lte(this.table.receivedDate, endDate),
      ),
    );
  }

  async findBySource(source: string): Promise<Invoice[]> {
    return await this.findMany(eq(this.table.source, source));
  }

  async findInvoicesByTotalRange(
    minTotal: number,
    maxTotal: number,
  ): Promise<Invoice[]> {
    return await this.findMany(
      and(
        gte(this.table.invoiceTotal, minTotal.toString()),
        lte(this.table.invoiceTotal, maxTotal.toString()),
      ),
    );
  }

  async searchInvoices(searchTerm: string): Promise<Invoice[]> {
    return await this.findMany(
      or(
        like(this.table.invoiceNumber, `%${searchTerm}%`),
        like(this.table.invoiceKey, `%${searchTerm}%`),
        like(this.table.state, `%${searchTerm}%`),
        like(this.table.source, `%${searchTerm}%`),
      ),
    );
  }

  async findInvoicesByProviderAndState(
    providerId: number,
    state: string,
  ): Promise<Invoice[]> {
    return await this.findMany(
      and(eq(this.table.providerId, providerId), eq(this.table.state, state)),
    );
  }

  async findInvoicesByMemberAndDateRange(
    memberId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<Invoice[]> {
    return await this.findMany(
      and(
        eq(this.table.memberId, memberId),
        gte(this.table.invoiceDate, startDate),
        lte(this.table.invoiceDate, endDate),
      ),
    );
  }

  async updateInvoiceState(
    id: number,
    state: string,
    updatedBy?: string,
  ): Promise<Invoice | undefined> {
    return await this.update(id, { state, updatedBy });
  }

  async updateInvoiceTotals(
    id: number,
    invoiceTotal?: string,
    fundedTotal?: string,
    paidTotal?: string,
    updatedBy?: string,
  ): Promise<Invoice | undefined> {
    const updateData: any = { updatedBy };
    if (invoiceTotal !== undefined) updateData.invoiceTotal = invoiceTotal;
    if (fundedTotal !== undefined) updateData.fundedTotal = fundedTotal;
    if (paidTotal !== undefined) updateData.paidTotal = paidTotal;

    return await this.update(id, updateData);
  }

  async getInvoiceStatistics(providerId?: number): Promise<{
    totalInvoices: number;
    totalAmount: number;
    averageAmount: number;
  }> {
    const whereClause = providerId
      ? eq(this.table.providerId, providerId)
      : undefined;

    const [totalInvoices, totalAmount, averageAmount] = await Promise.all([
      this.count(whereClause),
      this.db
        .select({
          total: sql<number>`SUM(CAST(${this.table.invoiceTotal} AS DECIMAL(20,2)))`,
        })
        .from(this.table)
        .where(and(whereClause || sql`1=1`, isNull(this.table.deletedAt)))
        .then((result) => parseFloat(result[0]?.total?.toString() || '0')),
      this.db
        .select({
          average: sql<number>`AVG(CAST(${this.table.invoiceTotal} AS DECIMAL(20,2)))`,
        })
        .from(this.table)
        .where(and(whereClause || sql`1=1`, isNull(this.table.deletedAt)))
        .then((result) => parseFloat(result[0]?.average?.toString() || '0')),
    ]);

    return {
      totalInvoices,
      totalAmount,
      averageAmount,
    };
  }
}
