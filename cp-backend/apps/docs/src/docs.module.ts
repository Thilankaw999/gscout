/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: DocsApiModule
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Logger, Module } from '@nestjs/common';
import { DocsApiService } from './docs.service';
import { DocsApiController } from './docs.controller';

@Module({
  controllers: [DocsApiController],
  providers: [DocsApiService, Logger],
})
export class DocsApiModule {}
