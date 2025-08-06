/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: UserApiModule
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Module } from '@nestjs/common';
import { UserApiController } from './user.controller';
import { BaseAPIModule, CommonModule } from '@app/common';
import { DbModule } from '@app/db';
import { UserContextModule } from '@app/user-context';
import { SecretsManagerModule } from '@app/aws';

// Use Cases
import { GetUserUseCase } from './queries/get-user/get-user.usecase';

// Services
import { ItsSystemClientService } from './services/its-client.service';
import { UserProfileTransformationService } from './services/user-profile-transformation.service';

@Module({
  imports: [BaseAPIModule, CommonModule, DbModule, UserContextModule, SecretsManagerModule],
  controllers: [UserApiController],
  providers: [
    GetUserUseCase, 
    ItsSystemClientService,
    UserProfileTransformationService,
  ],
})
export class UserApiModule {}
