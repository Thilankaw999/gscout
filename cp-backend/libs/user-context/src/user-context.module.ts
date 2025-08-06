/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description:
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Module, Scope } from '@nestjs/common';
import { UserContextService } from './user-context.service';

@Module({
  providers: [
    {
      provide: UserContextService,
      useClass: UserContextService,
      scope: Scope.REQUEST,
    },
  ],
  exports: [UserContextService],
})
export class UserContextModule {}
