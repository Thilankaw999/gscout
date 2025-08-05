/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: Handler
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import {
  APIGatewayProxyEventV2,
  Callback,
  Context,
  Handler,
  initializeServer,
} from '@app/common';
import { DocsApiModule } from './docs.module';

let server: Handler;

export const handler: Handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
  callback: Callback,
) => {
  server = await initializeServer(event, context, DocsApiModule, server);
  return server(event, context, callback);
};
