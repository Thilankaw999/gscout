/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 10-09-2024
 * Description: Database Module using Drizzle ORM
 * Module: LiPMPS Backend
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Module, Global } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { databaseProvider } from './database.provider';

@Global()
@Module({
  providers: [DatabaseService, databaseProvider],
  exports: [DatabaseService, databaseProvider],
})
export class DatabaseModule {}
