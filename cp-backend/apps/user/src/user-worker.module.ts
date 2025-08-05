/**
 * user-worker.module.ts
 * Author: Sujeban Elankeswaran
 * Description: Module for managing user-related worker use cases.
 * Module: SLS API User Worker
 */

import { Module } from '@nestjs/common';
import { DbModule } from '@app/db';

// Import UseCases
import { BaseAPIModule } from '@app/common';

@Module({
  imports: [BaseAPIModule, DbModule],
  providers: [],
})
export class UserWorkerModule {}
