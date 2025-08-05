/**
 * main.ts
 * Author: Insurance Portal Development Team
 * Description: Chatbot API Lambda Entry Point
 * Module: Insurance Property Portal Backend
 */

import {
  APIGatewayProxyEventV2,
  Callback,
  Context,
  Handler,
  initializeServer,
} from '@app/common';
import { ChatbotApiModule } from './chatbot.module';

let server: Handler;

export const handler: Handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
  callback: Callback,
) => {
  server = await initializeServer(event, context, ChatbotApiModule, server);
  return server(event, context, callback);
}; 