/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description:
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { SetMetadata } from '@nestjs/common';
import { ACTIONS, CHECK_FEATURES_KEY, RESOURCES } from './features.constants';

export type FeaturePermission = [RESOURCES, ACTIONS];

export const CheckFeatures = (...permissions: FeaturePermission[]) =>
  SetMetadata(CHECK_FEATURES_KEY, permissions);
