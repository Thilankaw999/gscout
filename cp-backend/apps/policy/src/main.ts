/**
 * main.ts
 * Author: Insurance Portal Development Team
 * Description: Main entry point for Policy API Lambda function
 * Module: Insurance Property Portal Backend
 */

import {
  APIGatewayProxyEventV2,
  Callback,
  Context,
  Handler,
  initializeServer,
} from '@app/common';
import { PolicyApiModule } from './policy.module';

let server: Handler;

export const handler: Handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
  callback: Callback,
) => {
  server = await initializeServer(event, context, PolicyApiModule, server);
  return server(event, context, callback);
}; 