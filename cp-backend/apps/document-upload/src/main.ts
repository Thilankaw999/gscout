/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: Document Upload Main Handler
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { createServerlessHandler } from '@app/common';
import { DocumentUploadModule } from './document-upload.module';

export const handler = createServerlessHandler(async () => {
  const expressApp = require('express')();
  const adapter = new ExpressAdapter(expressApp);
  
  const app = await NestFactory.create(DocumentUploadModule, adapter);
  
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  await app.init();
  return expressApp;
});
