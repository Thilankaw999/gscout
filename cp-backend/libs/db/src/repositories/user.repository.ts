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

  async findByEmail(email: string): Promise<User | undefined> {
    return await this.findOne(eq(this.table.email, email));
  }

  async findByCognitoKey(cognitoKey: string): Promise<User | undefined> {
    return await this.findOne(eq(this.table.cognitoKey, cognitoKey));
  }

  async findByUserName(userName: string): Promise<User | undefined> {
    return await this.findOne(eq(this.table.userName, userName));
  }

  async findByMobileNumber(mobileNumber: string): Promise<User | undefined> {
    return await this.findOne(eq(this.table.mobileNumber, mobileNumber));
  }

  async findActiveUsers(): Promise<User[]> {
    return await this.findMany(eq(this.table.isActive, 1));
  }

  async findStaffUsers(): Promise<User[]> {
    return await this.findMany(eq(this.table.isStaff, 1));
  }

  async findVerifiedUsers(): Promise<User[]> {
    return await this.findMany(eq(this.table.isVerified, 1));
  }

  async searchUsers(searchTerm: string): Promise<User[]> {
    return await this.findMany(
      or(
        like(this.table.email, `%${searchTerm}%`),
        like(this.table.firstName, `%${searchTerm}%`),
        like(this.table.lastName, `%${searchTerm}%`),
        like(this.table.userName, `%${searchTerm}%`),
      ),
    );
  }

  async updateLastLoggedIn(id: number): Promise<User | undefined> {
    return await this.update(id, { lastLoggedIn: new Date() });
  }

  async activateUser(id: number): Promise<User | undefined> {
    return await this.update(id, { isActive: 1 });
  }

  async deactivateUser(id: number): Promise<User | undefined> {
    return await this.update(id, { isActive: 0 });
  }

  async verifyUser(id: number): Promise<User | undefined> {
    return await this.update(id, { isVerified: 1 });
  }

  async makeStaff(id: number): Promise<User | undefined> {
    return await this.update(id, { isStaff: 1 });
  }

  async removeStaff(id: number): Promise<User | undefined> {
    return await this.update(id, { isStaff: 0 });
  }
}
