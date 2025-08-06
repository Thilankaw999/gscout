/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 10-09-2024
 * Description: CustomerProfile Schema using Drizzle ORM
 * Module: LiPMPS Backend
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import {
  mysqlTable,
  int,
  varchar,
  text,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { auditFields, WithAuditFields } from './base.schema';

/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: User Schema for Girl Scouts OCR POC - Simplified for admin users
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import {
  mysqlTable,
  int,
  varchar,
  text,
  index,
  uniqueIndex,
  mysqlEnum,
} from 'drizzle-orm/mysql-core';
import { auditFields, WithAuditFields } from './base.schema';

export const users = mysqlTable(
  'users',
  {
    id: int('id').primaryKey().autoincrement(),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }),
    
    // Girl Scouts specific fields
    role: mysqlEnum('role', ['admin', 'staff', 'viewer']).default('viewer'),
    councilId: varchar('council_id', { length: 50 }), // Girl Scouts council identifier
    permissions: text('permissions'), // JSON string of permissions
    
    // Basic contact info (simplified)
    organization: varchar('organization', { length: 255 }).default('Girl Scouts of Eastern Pennsylvania'),
    
    ...auditFields,
  },
  (table) => ({
    emailIndex: index('idx_users_email').on(table.email),
    roleIndex: index('idx_users_role').on(table.role),
    councilIndex: index('idx_users_council').on(table.councilId),
    deletedAtIndex: index('idx_users_deleted_at').on(table.deletedAt),
    emailUnique: uniqueIndex('uk_users_email').on(table.email),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserWithAudit = User & WithAuditFields;
