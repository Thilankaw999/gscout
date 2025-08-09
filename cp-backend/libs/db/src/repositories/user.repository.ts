/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 10-09-2024
 * Description: User Repository using Drizzle ORM
 * Module: LiPMPS Backend
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, or, like } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.provider';
import { BaseRepository } from './base.repository';
import { users, User, NewUser } from '../schema/user.schema';

@Injectable()
export class UserRepository extends BaseRepository<
  typeof users,
  User,
  NewUser
> {
  constructor(
    @Inject(DATABASE_CONNECTION)
    protected readonly db: MySql2Database,
  ) {
    super(db, users);
  }

  // findByCustomerId method removed as customerId field is no longer used

  async findByEmail(email: string): Promise<User | undefined> {
    return await this.findOne(eq(this.table.email, email));
  }

  async findByPhone(phone: string): Promise<User | undefined> {
    return await this.findOne(eq(this.table.phone, phone));
  }

  async searchUsers(searchTerm: string): Promise<User[]> {
    return await this.findMany(
      or(
        like(this.table.email, `%${searchTerm}%`),
        like(this.table.name, `%${searchTerm}%`),
        like(this.table.phone, `%${searchTerm}%`),
      ),
    );
  }
}
