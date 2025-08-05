/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: PermissionsModule
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Module } from '@nestjs/common';
import { FeaturesGuard } from './features.decorator';
import { PermissionService } from './permission.service';
import { DbModule } from '@app/db';

@Module({
  imports: [DbModule],
  providers: [FeaturesGuard, PermissionService],
  exports: [FeaturesGuard, PermissionService],
})
export class PermissionsModule {}
