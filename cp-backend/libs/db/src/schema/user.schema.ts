/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 10-09-2024
 * Description: User Schema using Drizzle ORM
 * Module: LiPMPS Backend
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import {
  mysqlTable,
  int,
  varchar,
  tinyint,
  datetime,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { auditFields, WithAuditFields } from './base.schema';

export const users = mysqlTable(
  'user',
  {
    id: int('id').primaryKey().autoincrement(),
    email: varchar('email', { length: 100 }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    userName: varchar('user_name', { length: 100 }),
    mobileNumber: varchar('mobile_number', { length: 20 }),
    tncAcceptedDate: datetime('tnc_accepted_date'),
    isActive: tinyint('is_active').notNull().default(1),
    isStaff: tinyint('is_staff').notNull().default(0),
    cognitoKey: varchar('cognito_key', { length: 36 }),
    isVerified: tinyint('is_verified').notNull(),
    lastLoggedIn: timestamp('last_logged_in'),
    preferredName: varchar('preferred_name', { length: 100 }),
    pronoun: varchar('pronoun', { length: 50 }),
    ...auditFields,
  },
  (table) => ({
    cognitoKeyIndex: index('user_cognito_key_index').on(table.cognitoKey),
    emailIndex: index('idx_user_email').on(table.email),
    userNameIndex: index('idx_user_user_name').on(table.userName),
    mobileNumberIndex: index('idx_user_mobile_number').on(table.mobileNumber),
    isActiveIndex: index('idx_user_is_active').on(table.isActive),
    isStaffIndex: index('idx_user_is_staff').on(table.isStaff),
    isVerifiedIndex: index('idx_user_is_verified').on(table.isVerified),
    deletedAtIndex: index('idx_user_deleted_at').on(table.deletedAt),
    emailUnique: uniqueIndex('uk_user_email').on(table.email),
    cognitoKeyUnique: uniqueIndex('uk_user_cognito_key').on(table.cognitoKey),
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserWithAudit = User & WithAuditFields;
