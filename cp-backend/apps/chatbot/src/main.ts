/**
 * Author: Assistant
 * Created on: 2025-08-07
 * Description: Main handler for Chatbot API
 * Module: Girl Scouts Chatbot
 * Copyright (c) 2024 Girl Scouts All rights reserved.
 */

import {
  APIGatewayProxyEventV2,
  Callback,
  Context,
  Handler,
} from '@app/common';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, LogLevel } from '@nestjs/common';
import serverlessExpress from '@codegenie/serverless-express';
import * as express from 'express';
import { ChatbotModuleStandalone } from "./chatbot-standalone.module";

let server: Handler;

export const handler: Handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
  callback: Callback,
) => {
  if (!server) {
    server = await createNestApp();
  }
  return server(event, context, callback);
};

async function createNestApp(): Promise<Handler> {
  let loglevels: LogLevel[] = ['error', 'warn'];
  if (process.env.LOG_LEVEL === 'DEBUG') {
    loglevels = ['debug', 'log', ...loglevels];
  }

  const app = await NestFactory.create(ChatbotModuleStandalone, {
    logger: loglevels,
  });

  app.enableCors({ origin: '*' });
  
  // Enable JSON body parsing for serverless environments
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}
