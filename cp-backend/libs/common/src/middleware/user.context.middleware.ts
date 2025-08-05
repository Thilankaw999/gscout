/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: UserContextMiddleware
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { UserContextService } from '@app/user-context';
import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction } from 'express';

@Injectable()
export class UserContextMiddleware implements NestMiddleware {
  constructor(private readonly userContextService: UserContextService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    this.userContextService.clear();
    next();
  }
}
