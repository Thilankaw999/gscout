/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: AuditLogMiddleware
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction } from 'express';
import { Logger } from '@app/logger';
import { FirehoseService } from '@app/aws/firehose';
import { randomUUID } from 'crypto';
import dayjs from 'dayjs';

@Injectable()
export class AuditLogMiddleware implements NestMiddleware {
  method: string | undefined;
  path: string | undefined;
  user: string | undefined;
  requestId: string;
  function: string;
  service: string;

  private kinesisService: FirehoseService = new FirehoseService(this.logger);

  constructor(private readonly logger: Logger) {}

  async use({ event, context }, res: Response, next: NextFunction) {
    this.logger.debug(`AuditLogMiddleware: capturing audit`);

    const functionName = context.functionName;
    this.method = event.requestContext?.httpMethod;
    this.path = event.requestContext?.path;
    this.user = event.requestContext?.authorizer?.claims?.sub || '';
    this.requestId = context.awsRequestId;
    this.function = functionName;
    this.service = functionName?.split('-').splice(0, 2).join('-');

    const payload = this.buildAuditPayload();
    this.logger.debug('AuditLogMiddleware: publishing payload.');
    this.kinesisService.putRecord(
      payload,
      <string>process.env.auditEventStreamName,
    );
    this.clearAudit();

    this.logger.debug(`AuditLogMiddleware: audit persisted sucessfully`);
    next();
  }

  private clearAudit() {
    this.method = undefined;
    this.path = undefined;
    this.user = undefined;
    this.requestId = undefined;
    this.function = undefined;
    this.service = undefined;
    this.logger.debug('AuditService: properties cleard.');
  }

  private buildAuditPayload() {
    this.logger.debug('AuditService: payload created.');
    return {
      id: randomUUID(),
      method: this.method,
      path: this.path,
      user: this.user,
      requestId: this.requestId,
      function: this.function,
      service: this.service,
      recordedTime: dayjs().utc().toISOString(),
    };
  }
}
