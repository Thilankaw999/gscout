/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: LoggingMiddleware
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction } from 'express';
import { Logger } from '@app/logger';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: Logger) {}

  use({ event, context }, res: Response, next: NextFunction) {
    const functionName = context.functionName;
    const metadata = {
      method: event.requestContext?.httpMethod,
      path: event.requestContext?.path,
      user: event.requestContext?.authorizer?.claims?.sub,
      requestId: context.awsRequestId,
      functionName,
    };

    const initialLogData = {
      groups: event.requestContext?.authorizer?.claims
        ? event.requestContext?.authorizer?.claims['cognito:groups']
        : null,
    };

    this.logger.appendKeys(metadata);
    this.logger.removeKeys(['sampling_rate', 'service']);

    this.logger.info(functionName, initialLogData);
    this.logger.debug(functionName, { event, context });

    next();
  }
}
