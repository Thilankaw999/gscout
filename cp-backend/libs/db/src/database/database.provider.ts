/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 10-09-2024
 * Description: Database Provider using Drizzle ORM
 * Module: LiPMPS Backend
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Provider } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { ConfigProvider } from '@app/common/config-provider';
import { ENV_STAGES } from '@app/common/constants';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';

export const databaseProvider: Provider = {
  provide: DATABASE_CONNECTION,
  useFactory: async () => {
    const connection = await mysql.createConnection({
      host: ConfigProvider.get('database.host'),
      port: ConfigProvider.get('database.port'),
      user: ConfigProvider.get('database.user'),
      password: ConfigProvider.get('database.password'),
      database: ConfigProvider.get('database.database'),
    });

    const db = drizzle(connection, {
      logger:
        process.env.LOG_LEVEL === 'DEBUG' ||
        process.env.STAGE === ENV_STAGES.DEV,
    });

    return db;
  },
};
