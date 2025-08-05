/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 10-09-2024
 * Description: Database Service using Drizzle ORM
 * Module: LiPMPS Backend
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DATABASE_CONNECTION } from './database.provider';

@Injectable()
export class DatabaseService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: MySql2Database,
  ) {}

  getDb(): MySql2Database {
    return this.db;
  }
}
