/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: CommonModule
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Module } from '@nestjs/common';
import { BaseAPIModule } from './nest';
import { HttpClientService } from './http-client.service';
import { ConfigProvider } from './config-provider';

@Module({
  imports: [BaseAPIModule],
  providers: [HttpClientService, ConfigProvider],
  exports: [BaseAPIModule, HttpClientService, ConfigProvider],
})
export class CommonModule {}
