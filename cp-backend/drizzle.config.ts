/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 10-09-2024
 * Description: Drizzle Configuration
 * Module: LiPMPS Backend
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { defineConfig } from 'drizzle-kit';
import { ConfigProvider } from './libs/common/src/config-provider';

export default defineConfig({
  schema: './libs/db/src/schema/*.ts',
  out: './drizzle',
  dialect: 'mysql',
  dbCredentials: {
    host: ConfigProvider.get('database.host'),
    port: ConfigProvider.get('database.port'),
    user: ConfigProvider.get('database.user'),
    password: ConfigProvider.get('database.password'),
    database: ConfigProvider.get('database.database'),
  },
  verbose: true,
  strict: true,
}); 