/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: Common NestJS Functions and Classes
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { NestFactory } from '@nestjs/core';
import serverlessExpress from '@codegenie/serverless-express';
import { APIGatewayProxyEventV2, Context, Handler } from './lambda';
import {
  Global,
  LogLevel,
  MiddlewareConsumer,
  Module,
  NestModule,
  ValidationPipe,
} from '@nestjs/common';
import * as express from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PermissionService, PermissionsModule } from '@app/permissions';
import type { Response } from 'express';
import { Logger, LoggerModule } from '@app/logger';
import { ConfigProvider } from './config-provider';
import { DbModule } from '@app/db';
import { UserContextModule } from '@app/user-context';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { UserContextMiddleware } from './middleware/user.context.middleware';
import { AuditLogMiddleware } from './middleware/audit.middleware';
/**
 * This is the common boostrap method that will creates the nestjs server object to lambda handlers which serves https requests
 * @param module NestJS Module
 * @returns a Lambda Handler
 */
async function bootstrap(module: unknown): Promise<Handler> {
  let loglevels: LogLevel[] = ['error', 'warn'];
  if (process.env.LOG_LEVEL === 'DEBUG') {
    loglevels = ['debug', 'log', ...loglevels];
  }
  const app = await NestFactory.create(module, {
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

@Global()
@Module({
  imports: [PermissionsModule, LoggerModule, UserContextModule, DbModule],
  providers: [Logger, PermissionService, ConfigProvider],
  exports: [Logger, PermissionService, ConfigProvider],
})
export class SharedModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
    consumer.apply(UserContextMiddleware).forRoutes('*');
    if (process.env.isAuditEnabled === 'true') {
      consumer.apply(AuditLogMiddleware).forRoutes('*');
    }
  }
}

/**
 * BaseAPIModulewhich will be used to initialize every app module which serves https requests.
 * This module is intrumented with common middleware services that will handle common functionalities
 */
@Module({
  imports: [SharedModule],
})
class BaseAPIModule {}

/**
 * This is the common method which initializes the NestJS Server if it's not already initialized for the lambda handlers.
 * It attaches the event and context to the request so they caCCn be accessed in other parts of the applications such as middlewares and guards
 * @param event APIGateway lambda event param
 * @param context Lambda context param
 * @param module NestJS Module
 * @param server NestJS server instance if it's already initialised elase will be undefined
 * @returns
 */
async function initializeServer(
  event: APIGatewayProxyEventV2,
  context: Context,
  module: unknown,
  server: Handler | undefined,
) {
  server = server ?? (await bootstrap(module));
  express.request['event'] = event;
  express.request['context'] = context;
  return server;
}

/**
 * Creates and serves the Swagger JSON documentation for the specified NestJS module.
 *
 * This function bootstraps the NestJS application for the provided module,
 * generates the Swagger documentation using the configured API details,
 * and sends the generated Swagger document as a JSON response.
 *
 */
async function createSwaggerResponse(
  res: Response,
  module: unknown,
  title: string,
  description: string,
): Promise<void> {
  const app = await NestFactory.create(module);
  const config = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'account-key', // Name of the custom header
        in: 'header',
        description: 'Optional header for multi-tenant management',
      },
      'account-key', // Reference name for the header in Swagger
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  res.json(document);
}

export interface ExecutableUseCase<EventType, ResultType> {
  execute(event: EventType): Promise<ResultType>;
}
/**
 * Initializes and executes a specified use case in a worker Lambda.
 * @param module - The NestJS module to initialize (e.g., UserWorkerModule).
 * @param useCaseClass - The class of the use case to execute.
 * @param event - The event object passed to the Lambda handler.
 * @returns The response from the executed use case.
 */
async function initializeWorker<
  EventType,
  ResultType,
  U extends ExecutableUseCase<EventType, ResultType>,
>(
  module: unknown,
  useCaseClass: new (...args: any[]) => U,
  event: EventType,
): Promise<ResultType> {
  const app = await NestFactory.create(module, {
    logger: ['error', 'warn'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const useCase = app.get(useCaseClass);
  const response = await useCase.execute(event);

  await app.close();

  return response;
}

export {
  bootstrap,
  BaseAPIModule,
  initializeServer,
  createSwaggerResponse,
  initializeWorker,
};
