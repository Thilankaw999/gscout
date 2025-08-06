/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: OCR Processor Main Handler
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { createServerlessHandler } from '@app/common';
import { OcrProcessorModule } from './ocr-processor.module';

export const handler = createServerlessHandler(async () => {
  const expressApp = require('express')();
  const adapter = new ExpressAdapter(expressApp);
  
  const app = await NestFactory.create(OcrProcessorModule, adapter);
  
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  await app.init();
  return expressApp;
});
