/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: Drizzle Configuration - Girl Scouts OCR POC
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
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