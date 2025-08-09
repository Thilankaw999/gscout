/**
 * Author: AI Assistant
 * Created on: 05-08-2025
 * Description: Document Upload Handler
 * Module: Girl Scouts POC Backend
 * Copyright (c) 2025 Girl Scouts All rights reserved.
 */

import {
  APIGatewayProxyEventV2,
  Callback,
  Context,
  Handler,
  initializeServer,
} from '@app/common';
import { DocumentUploadApiModule } from './document-upload.module';

let server: Handler;

export const handler: Handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
  callback: Callback,
) => {
  server = await initializeServer(event, context, DocumentUploadApiModule, server);
  return server(event, context, callback);
};
