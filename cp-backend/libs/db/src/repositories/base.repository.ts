/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 10-09-2024
 * Description: Base Repository with common CRUD operations
 * Module: LiPMPS Backend
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { MySqlTableWithColumns } from 'drizzle-orm/mysql-core';
import { eq, and, isNull, desc, asc, SQL, sql } from 'drizzle-orm';
import { ResultSetHeader } from 'mysql2';
import { DATABASE_CONNECTION } from '../database/database.provider';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export abstract class BaseRepository<
  TTable extends MySqlTableWithColumns<any>,
  TSelect = any,
  TInsert = any,
> {
  constructor(
    @Inject(DATABASE_CONNECTION)
    protected readonly db: MySql2Database,
    protected readonly table: TTable,
  ) {}

  async findById(id: number): Promise<TSelect | undefined> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.table.id, id), isNull(this.table.deletedAt)))
      .limit(1);
    return result[0];
  }

  async findByIds(ids: number[]): Promise<TSelect[]> {
    if (ids.length === 0) return [];
    return await this.db
      .select()
      .from(this.table)
      .where(
        and(
          sql`${this.table.id} IN (${sql.join(
            ids.map((id) => sql`${id}`),
            sql`, `,
          )})`,
          isNull(this.table.deletedAt),
        ),
      );
  }

  async findAll(): Promise<TSelect[]> {
    return await this.db
      .select()
      .from(this.table)
      .where(isNull(this.table.deletedAt));
  }

  async findOne(where: SQL): Promise<TSelect | undefined> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(and(where, isNull(this.table.deletedAt)))
      .limit(1);
    return result[0];
  }

  async findMany(where?: SQL): Promise<TSelect[]> {
    const conditions = where
      ? and(where, isNull(this.table.deletedAt))
      : isNull(this.table.deletedAt);
    return await this.db.select().from(this.table).where(conditions);
  }

  async create(data: TInsert): Promise<TSelect> {
    const result = await this.db.insert(this.table).values(data);
    const insertResult = result[0] as ResultSetHeader;
    return await this.findById(insertResult.insertId);
  }

  async createMany(data: TInsert[]): Promise<TSelect[]> {
    if (data.length === 0) return [];
    const result = await this.db.insert(this.table).values(data);
    const insertResults = result as ResultSetHeader[];
    const ids = insertResults.map((r) => r.insertId);
    return await this.findByIds(ids);
  }

  async update(
    id: number,
    data: Partial<TInsert>,
  ): Promise<TSelect | undefined> {
    await this.db
      .update(this.table)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(this.table.id, id));
    return await this.findById(id);
  }

  async updateMany(where: SQL, data: Partial<TInsert>): Promise<void> {
    await this.db
      .update(this.table)
      .set({ ...data, updatedAt: new Date() })
      .where(and(where, isNull(this.table.deletedAt)));
  }

  async delete(id: number, deletedBy?: string): Promise<void> {
    await this.db
      .update(this.table)
      .set({
        deletedAt: new Date(),
        deletedBy: deletedBy || 'system',
        updatedAt: new Date(),
      })
      .where(eq(this.table.id, id));
  }

  async deleteMany(where: SQL, deletedBy?: string): Promise<void> {
    await this.db
      .update(this.table)
      .set({
        deletedAt: new Date(),
        deletedBy: deletedBy || 'system',
        updatedAt: new Date(),
      })
      .where(and(where, isNull(this.table.deletedAt)));
  }

  async count(where?: SQL): Promise<number> {
    const conditions = where
      ? and(where, isNull(this.table.deletedAt))
      : isNull(this.table.deletedAt);
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(this.table)
      .where(conditions);
    return result[0].count;
  }

  async paginate(
    options: PaginationOptions = {},
    where?: SQL,
  ): Promise<PaginatedResult<TSelect>> {
    const {
      page = 1,
      limit = 10,
      orderBy = 'id',
      orderDirection = 'desc',
    } = options;
    const offset = (page - 1) * limit;

    const conditions = where
      ? and(where, isNull(this.table.deletedAt))
      : isNull(this.table.deletedAt);

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(this.table)
        .where(conditions)
        .orderBy(
          orderDirection === 'desc'
            ? desc(this.table[orderBy as keyof typeof this.table])
            : asc(this.table[orderBy as keyof typeof this.table]),
        )
        .limit(limit)
        .offset(offset),
      this.count(where),
    ]);

    return {
      data,
      total: totalResult,
      page,
      limit,
      totalPages: Math.ceil(totalResult / limit),
    };
  }
}
