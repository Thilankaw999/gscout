/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: UserApiModule
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Module } from '@nestjs/common';
import { UserApiController } from './user.controller';
import { BaseAPIModule } from '@app/common';
import { DbModule } from '@app/db';

// Use Cases
import { GetUserUseCase } from './queries/get-user/get-user.usecase';
import { PatchUserUseCase } from './commands/patch-user/patch-user.usecase';

@Module({
  imports: [BaseAPIModule, DbModule],
  controllers: [UserApiController],
  providers: [GetUserUseCase, PatchUserUseCase],
})
export class UserApiModule {}
