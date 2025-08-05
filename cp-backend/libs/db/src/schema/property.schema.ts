/**
 * Author: Insurance Portal Development Team
 * Created on: 2024-12-19
 * Description: Property Schema for Insurance Policies using Drizzle ORM
 * Module: Insurance Property Portal Backend
 * Copyright (c) 2024 Proper Insure All rights reserved.
 */

import {
  mysqlTable,
  int,
  varchar,
  text,
  date,
  decimal,
  index,
} from 'drizzle-orm/mysql-core';
import { auditFields, WithAuditFields } from './base.schema';
import { users } from './user.schema';

export const properties = mysqlTable(
  'properties',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('user_id').notNull().references(() => users.id),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 50 }).notNull(), // COMMERCIAL, RESIDENTIAL, etc.
    address: text('address').notNull(),
    policyNumber: varchar('policy_number', { length: 100 }),
    effectiveDate: date('effective_date'),
    expirationDate: date('expiration_date'),
    coverageAmount: decimal('coverage_amount', { precision: 15, scale: 2 }),
    deductible: decimal('deductible', { precision: 15, scale: 2 }),
    status: varchar('status', { length: 50 }), // ACTIVE, INACTIVE, EXPIRED
    ...auditFields,
  },
  (table) => ({
    userIdIndex: index('idx_properties_user_id').on(table.userId),
    policyNumberIndex: index('idx_properties_policy_number').on(table.policyNumber),
    typeIndex: index('idx_properties_type').on(table.type),
    statusIndex: index('idx_properties_status').on(table.status),
    effectiveDateIndex: index('idx_properties_effective_date').on(table.effectiveDate),
    expirationDateIndex: index('idx_properties_expiration_date').on(table.expirationDate),
    deletedAtIndex: index('idx_properties_deleted_at').on(table.deletedAt),
  }),
);

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type PropertyWithAudit = Property & WithAuditFields; 