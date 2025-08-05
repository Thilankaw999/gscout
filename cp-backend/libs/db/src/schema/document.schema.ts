/**
 * Author: Insurance Portal Development Team
 * Created on: 2024-12-19
 * Description: Documents Schema for File Management using Drizzle ORM
 * Module: Insurance Property Portal Backend
 * Copyright (c) 2024 Proper Insure All rights reserved.
 */

import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
  bigint,
  index,
} from 'drizzle-orm/mysql-core';
import { auditFields, WithAuditFields } from './base.schema';
import { users } from './user.schema';

export const documents = mysqlTable(
  'documents',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('user_id').notNull().references(() => users.id),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 100 }).notNull(), // POLICY, CLAIM, ASSESSMENT, etc.
    filePath: text('file_path').notNull(), // S3 key or file storage path
    fileSize: bigint('file_size', { mode: 'number' }), // File size in bytes
    contentType: varchar('content_type', { length: 100 }), // MIME type
    uploadDate: timestamp('upload_date').notNull(),
    s3Bucket: varchar('s3_bucket', { length: 255 }), // S3 bucket name
    s3Key: varchar('s3_key', { length: 500 }), // S3 object key
    downloadUrl: text('download_url'), // Pre-signed URL (temporary)
    urlExpiresAt: timestamp('url_expires_at'), // URL expiration timestamp
    ...auditFields,
  },
  (table) => ({
    userIdIndex: index('idx_documents_user_id').on(table.userId),
    typeIndex: index('idx_documents_type').on(table.type),
    uploadDateIndex: index('idx_documents_upload_date').on(table.uploadDate),
    s3BucketIndex: index('idx_documents_s3_bucket').on(table.s3Bucket),
    s3KeyIndex: index('idx_documents_s3_key').on(table.s3Key),
    deletedAtIndex: index('idx_documents_deleted_at').on(table.deletedAt),
  }),
);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentWithAudit = Document & WithAuditFields; 