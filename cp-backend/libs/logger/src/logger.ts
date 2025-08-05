/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: Logger
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Logger as LambdaLogger } from '@aws-lambda-powertools/logger';
import { Injectable } from '@nestjs/common';

@Injectable()
export class Logger extends LambdaLogger {}
