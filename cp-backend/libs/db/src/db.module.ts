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
import { InvoiceRepository } from './repositories/invoice.repository';

@Module({
  providers: [UserRepository, InvoiceRepository],
  imports: [DrizzleDatabaseModule],
  exports: [
    // Export repositories for use in vertical slice architecture
    UserRepository,
    InvoiceRepository,
    // Export database service for direct access if needed
    DrizzleDatabaseModule,
  ],
})
export class DbModule {}
