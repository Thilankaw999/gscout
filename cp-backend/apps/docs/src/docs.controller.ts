/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: DocsApiController
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Controller, Get, Res } from '@nestjs/common';
import { DocsApiService } from './docs.service';
import type { Response } from 'express';

@Controller('docs')
export class DocsApiController {
  constructor(private readonly docsApiService: DocsApiService) {}

  @Get('/swagger.json')
  async getSwaggerJson(@Res() res: Response) {
    const aggregatedSwagger =
      await this.docsApiService.getAggregatedSwaggerJson();
    res.json(aggregatedSwagger);
  }

  @Get('/')
  async serveSwaggerUi(@Res() res: Response) {
    res.send(this.docsApiService.getSwaggerDocumentHTML());
  }
}
