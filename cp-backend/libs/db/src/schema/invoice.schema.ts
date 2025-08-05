/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 10-09-2024
 * Description: Invoice Schema using Drizzle ORM
 * Module: LiPMPS Backend
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import {
  mysqlTable,
  int,
  varchar,
  decimal,
  date,
  timestamp,
  index,
} from 'drizzle-orm/mysql-core';
import { auditFields, WithAuditFields } from './base.schema';

export const invoices = mysqlTable(
  'invoice',
  {
    id: int('id').primaryKey().autoincrement(),
    invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
    invoiceKey: varchar('invoice_key', { length: 36 }),
    memberId: int('member_id'),
    providerAccountId: int('provider_account_id'),
    providerId: int('provider_id'),
    state: varchar('state', { length: 50 }),
    invoiceTotal: decimal('invoice_total', { precision: 20, scale: 2 }),
    fundedTotal: decimal('funded_total', { precision: 20, scale: 2 }),
    paidTotal: decimal('paid_total', { precision: 20, scale: 2 }),
    invoiceDate: date('invoice_date'),
    receivedDate: timestamp('received_date'),
    source: varchar('source', { length: 50 }).default('system'),
    ...auditFields,
  },
  (table) => ({
    invoiceNumberIndex: index('idx_invoice_invoice_number').on(
      table.invoiceNumber,
    ),
    memberIdIndex: index('idx_invoice_member_id').on(table.memberId),
    providerIdIndex: index('idx_invoice_provider_id').on(table.providerId),
    providerAccountIdIndex: index('idx_invoice_provider_account_id').on(
      table.providerAccountId,
    ),
    stateIndex: index('idx_invoice_state').on(table.state),
    invoiceDateIndex: index('idx_invoice_invoice_date').on(table.invoiceDate),
    receivedDateIndex: index('idx_invoice_received_date').on(
      table.receivedDate,
    ),
    deletedAtIndex: index('idx_invoice_deleted_at').on(table.deletedAt),
  }),
);

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type InvoiceWithAudit = Invoice & WithAuditFields;
