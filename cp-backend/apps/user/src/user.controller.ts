/**
 * user.controller.ts
 * Author: Sujeban Elankeswaran
 * Description: Controller to manage user-related operations in LiSLS Boilerplate.
 * Module: LiSLS Boilerplate
 */

import {
  applyDecorators,
  Controller,
  Get,
  HttpStatus,
  Res,
  UseGuards,
  Headers,
  Req,
} from '@nestjs/common';
import {
  ACTIONS,
  CheckFeatures,
  FeaturesGuard,
  RESOURCES,
} from '@app/permissions';
import { createSwaggerResponse } from '@app/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
  ApiHeader,
} from '@nestjs/swagger';
import { UserApiModule } from './user.module';
import { GetUserUseCase } from './queries/get-user/get-user.usecase';
import { CustomerProfileDto} from './dto/customer-profile.dto';

@Controller('user')
@ApiTags('User')
@UseGuards(FeaturesGuard)
export class UserApiController {
  constructor(
    private readonly getUserUseCase: GetUserUseCase,
  ) {}

  @Get()
  @CheckFeatures([RESOURCES.USER, ACTIONS.GET])
  @GetUserAPIDocs()
  async getUser(
    @Req() request: any,
  ): Promise<CustomerProfileDto> {
    return this.getUserUseCase.execute();
  }

  @Get('/docs/swagger.json')
  @ApiExcludeEndpoint()
  async getSwaggerJson(@Res() res) {
    return createSwaggerResponse(
      res,
      UserApiModule,
      'User API',
      'User API Documentation',
    );
  }
}

// Swagger Documentation Decorators
function GetUserAPIDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Retrieve user profile information' }),
    ApiHeader({
      name: 'authorization',
      description: 'Bearer token for authentication',
      required: true,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User profile data retrieved successfully',
      type: CustomerProfileDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - Invalid credentials',
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error',
    }),
  );
}
