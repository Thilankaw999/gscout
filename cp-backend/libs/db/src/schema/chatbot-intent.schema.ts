/**
 * Author: Insurance Portal Development Team
 * Created on: 2024-12-19
 * Description: ChatBot Intents Schema for Chatbot Interactions using Drizzle ORM
 * Module: Insurance Property Portal Backend
 * Copyright (c) 2024 Proper Insure All rights reserved.
 */

import {
  mysqlTable,
  int,
  varchar,
  text,
  json,
  timestamp,
  index,
} from 'drizzle-orm/mysql-core';
import { auditFields, WithAuditFields } from './base.schema';
import { users } from './user.schema';

export const chatbotIntents = mysqlTable(
  'chatbot_intents',
  {
    id: int('id').primaryKey().autoincrement(),
    userId: int('user_id').notNull().references(() => users.id),
    intent: varchar('intent', { length: 255 }).notNull(),
    parameters: json('parameters'), // Store intent parameters as JSON
    response: text('response'), // Generated response
    sessionId: varchar('session_id', { length: 255 }), // Chat session ID
    confidence: varchar('confidence', { length: 50 }), // Intent confidence level
    processed: timestamp('processed').defaultNow(), // When intent was processed
    ...auditFields,
  },
  (table) => ({
    userIdIndex: index('idx_chatbot_intents_user_id').on(table.userId),
    intentIndex: index('idx_chatbot_intents_intent').on(table.intent),
    sessionIdIndex: index('idx_chatbot_intents_session_id').on(table.sessionId),
    processedIndex: index('idx_chatbot_intents_processed').on(table.processed),
    deletedAtIndex: index('idx_chatbot_intents_deleted_at').on(table.deletedAt),
  }),
);

export type ChatbotIntent = typeof chatbotIntents.$inferSelect;
export type NewChatbotIntent = typeof chatbotIntents.$inferInsert;
export type ChatbotIntentWithAudit = ChatbotIntent & WithAuditFields; 