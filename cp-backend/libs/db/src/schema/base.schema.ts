/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 10-09-2024
 * Description: Base Schema with Audit Fields
 * Module: LiPMPS Backend
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { timestamp, varchar } from 'drizzle-orm/mysql-core';

// Base audit fields that can be extended by other schemas
export const auditFields = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  createdBy: varchar('created_by', { length: 255 }).default('system'),
  updatedBy: varchar('updated_by', { length: 255 }).default('system'),
  deletedAt: timestamp('deleted_at'),
  deletedBy: varchar('deleted_by', { length: 255 }),
};

// Helper type for entities with audit fields
export type WithAuditFields = {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  deletedAt: Date | null;
  deletedBy: string | null;
};
