# Database Module - Drizzle ORM

This module provides a modern, type-safe database layer using Drizzle ORM for the LiPMPS Backend application.

## Features

- **Type-safe queries** with full TypeScript support
- **Repository pattern** for clean separation of concerns
- **Audit fields** automatically handled (created_at, updated_at, created_by, updated_by, deleted_at, deleted_by)
- **Soft deletes** built-in
- **Pagination** support
- **Vertical slice architecture** ready
- **MySQL** support with optimized queries

## Architecture

### Schema Layer
- `schema/base.schema.ts` - Base audit fields and types
- `schema/user.schema.ts` - User table schema
- `schema/invoice.schema.ts` - Invoice table schema

### Repository Layer
- `repositories/base.repository.ts` - Base repository with common CRUD operations
- `repositories/user.repository.ts` - User-specific repository methods
- `repositories/invoice.repository.ts` - Invoice-specific repository methods

### Database Layer
- `database/database.provider.ts` - Database connection provider
- `database/database.service.ts` - Database service wrapper
- `database/database.module.ts` - Database module configuration

## Usage

### Basic Repository Usage

```typescript
import { Injectable } from '@nestjs/common';
import { UserRepository } from '@app/db';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findUserById(id: number) {
    return await this.userRepository.findById(id);
  }

  async createUser(userData: NewUser) {
    return await this.userRepository.create(userData);
  }

  async updateUser(id: number, userData: Partial<NewUser>) {
    return await this.userRepository.update(id, userData);
  }

  async deleteUser(id: number) {
    return await this.userRepository.delete(id);
  }
}
```

### Advanced Querying

```typescript
import { eq, and, or, like } from 'drizzle-orm';

// Find active users by email or username
const users = await this.userRepository.findMany(
  and(
    eq(this.userRepository.table.isActive, 1),
    or(
      like(this.userRepository.table.email, '%@example.com'),
      like(this.userRepository.table.userName, 'admin%')
    )
  )
);

// Pagination
const result = await this.userRepository.paginate(
  { page: 1, limit: 10, orderBy: 'createdAt', orderDirection: 'desc' },
  eq(this.userRepository.table.isActive, 1)
);
```

### Direct Database Access

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { DatabaseService } from '@app/db';
import { MySql2Database } from 'drizzle-orm/mysql2';

@Injectable()
export class CustomService {
  constructor(private readonly dbService: DatabaseService) {}

  async customQuery() {
    const db = this.dbService.getDb();
    
    return await db
      .select()
      .from(users)
      .where(eq(users.isActive, 1))
      .limit(10);
  }
}
```

## Migration Management

### Generate Migration
```bash
npm run drizzle-kit generate
```

### Apply Migration
```bash
npm run drizzle-kit migrate
```

### Push Schema (Development)
```bash
npm run drizzle-kit push
```

## Configuration

The database connection is configured through the existing config system:

```typescript
// environment/env.json
{
  "database": {
    "host": "localhost",
    "port": 3306,
    "user": "username",
    "password": "password",
    "database": "database_name"
  }
}
```

## Audit Fields

All entities automatically include audit fields:

- `createdAt` - Timestamp when record was created
- `updatedAt` - Timestamp when record was last updated
- `createdBy` - User who created the record
- `updatedBy` - User who last updated the record
- `deletedAt` - Timestamp when record was soft deleted
- `deletedBy` - User who deleted the record

## Soft Deletes

All delete operations are soft deletes by default. Records are marked as deleted but not physically removed from the database.

```typescript
// Soft delete
await this.userRepository.delete(userId);

// Hard delete (if needed)
await this.dbService.getDb()
  .delete(users)
  .where(eq(users.id, userId));
```

## Type Safety

All queries are fully type-safe:

```typescript
// TypeScript will catch errors at compile time
const user: User = await this.userRepository.findById(1);
const newUser: NewUser = {
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  isVerified: 1
};
```

## Performance

- **Connection pooling** - Efficient database connections
- **Query optimization** - Drizzle generates optimized SQL
- **Index support** - All indexes from DDL are preserved
- **Lazy loading** - Queries are only executed when needed

## Testing

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '@app/db';

describe('UserRepository', () => {
  let repository: UserRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserRepository],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
  });

  it('should find user by email', async () => {
    const user = await repository.findByEmail('test@example.com');
    expect(user).toBeDefined();
  });
});
```

## Migration from TypeORM

This module replaces the previous TypeORM implementation. Key differences:

1. **Type Safety** - Better TypeScript support
2. **Performance** - More efficient queries
3. **Simplicity** - Less boilerplate code
4. **Repository Pattern** - Cleaner separation of concerns

### Breaking Changes

- Entity classes replaced with schema definitions
- Repository injection pattern changed
- Some query methods have different signatures

### Migration Guide

1. Replace entity imports with schema imports
2. Update repository injection in services
3. Update query syntax for complex queries
4. Test thoroughly before deployment

## Contributing

When adding new tables:

1. Create schema file in `schema/` directory
2. Create repository file in `repositories/` directory
3. Update exports in index files
4. Add to main DB module
5. Create and test migrations
6. Update documentation 