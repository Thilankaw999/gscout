/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 10-09-2024
 * Description: Database Module using Drizzle ORM
 * Module: LiPMPS Backend
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Module } from '@nestjs/common';
import { DatabaseModule as DrizzleDatabaseModule } from './database/database.module';
import { UserRepository } from './repositories/user.repository';
import { ClaimRepository } from './repositories/claim.repository';
import { DocumentRepository } from './repositories/document.repository';
import { ChatbotIntentRepository } from './repositories/chatbot-intent.repository';
import { PolicyRepository } from './repositories/policy.repository';
import { PolicyTermDetailsRepository } from './repositories/policy-term-details.repository';

@Module({
  providers: [
    UserRepository,
    ClaimRepository,
    DocumentRepository,
    ChatbotIntentRepository,
    PolicyRepository,
    PolicyTermDetailsRepository,
  ],
  imports: [DrizzleDatabaseModule],
  exports: [
    // Export repositories for use in vertical slice architecture
    UserRepository,
    ClaimRepository,
    DocumentRepository,
    ChatbotIntentRepository,
    PolicyRepository,
    PolicyTermDetailsRepository,
    // Export database service for direct access if needed
    DrizzleDatabaseModule,
  ],
})
export class DbModule {}
