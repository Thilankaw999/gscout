/**
 * Author: Insurance Portal Development Team
 * Created on: 2024-12-19
 * Description: Claims Schema for Insurance Claims using Drizzle ORM
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
  timestamp,
  index,
} from 'drizzle-orm/mysql-core';
import { auditFields, WithAuditFields } from './base.schema';
import { users } from './user.schema';
import { properties } from './property.schema';

export const claims = mysqlTable(
  'claims',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('user_id').notNull().references(() => users.id),
    propertyId: int('property_id').notNull().references(() => properties.id),
    number: varchar('number', { length: 100 }).notNull(),
    damageType: varchar('damage_type', { length: 255 }).notNull(),
    dateOfLoss: date('date_of_loss').notNull(),
    progress: varchar('progress', { length: 100 }).notNull(),
    address: text('address').notNull(),
    estimatedDamage: decimal('estimated_damage', { precision: 15, scale: 2 }),
    lastUpdated: timestamp('last_updated').notNull(),
    description: text('description'),
    adjusterName: varchar('adjuster_name', { length: 255 }),
    estimatedResolutionDate: date('estimated_resolution_date'),
    ...auditFields,
  },
  (table) => ({
    userIdIndex: index('idx_claims_user_id').on(table.userId),
    propertyIdIndex: index('idx_claims_property_id').on(table.propertyId),
    numberIndex: index('idx_claims_number').on(table.number),
    damageTypeIndex: index('idx_claims_damage_type').on(table.damageType),
    progressIndex: index('idx_claims_progress').on(table.progress),
    dateOfLossIndex: index('idx_claims_date_of_loss').on(table.dateOfLoss),
    lastUpdatedIndex: index('idx_claims_last_updated').on(table.lastUpdated),
    deletedAtIndex: index('idx_claims_deleted_at').on(table.deletedAt),
  }),
);

export type Claim = typeof claims.$inferSelect;
export type NewClaim = typeof claims.$inferInsert;
export type ClaimWithAudit = Claim & WithAuditFields; 