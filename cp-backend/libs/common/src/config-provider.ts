/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: UseCase
 * Module: LiSLS Boilerplate Config value provider
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Injectable } from '@nestjs/common';
import * as env from '../../../environment/env.json';

@Injectable()
export class ConfigProvider {
  private static envConfig: Record<string, any>;

  constructor() {
    if (!ConfigProvider.envConfig) {
      ConfigProvider.envConfig = env;
    }
  }

  get(key: string): any {
    return this.getNestedProperty(ConfigProvider.envConfig, key);
  }

  static get(key: string): any {
    const val = this.getNestedProperty(env, key);
    return val;
  }

  private static getNestedProperty(obj: Record<string, any>, key: string): any {
    return key.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
  }

  private getNestedProperty(obj: Record<string, any>, key: string): any {
    return key.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
  }
}
