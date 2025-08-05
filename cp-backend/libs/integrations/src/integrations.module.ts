/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: External integrations module
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Module } from '@nestjs/common';
import { GooglePlacesApiService } from './google-places/google-places-api.service';

@Module({
  providers: [GooglePlacesApiService],
  exports: [GooglePlacesApiService],
})
export class IntegrationsModule {}
