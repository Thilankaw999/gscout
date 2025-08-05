/**
 * user.controller.ts
 * Author: Sujeban Elankeswaran
 * Description: Controller to manage user-related operations in LiSLS Boilerplate.
 * Module: LiSLS Boilerplate
 */

import {
  applyDecorators,
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  Res,
  UseGuards,
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
  ApiBody,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { UserApiModule } from './user.module';
import { GetUserUseCase } from './queries/get-user/get-user.usecase';
import { PatchUserDto } from './dto/patch-user.dto';
import { PatchUserUseCase } from './commands/patch-user/patch-user.usecase';
import { CustomerProfileResponseDto } from './dto/customer-profile.dto';

@Controller('user')
@ApiTags('User')
@UseGuards(FeaturesGuard)
export class UserApiController {
  constructor(
    private readonly getUserUseCase: GetUserUseCase,
    private readonly patchUserUseCase: PatchUserUseCase,
  ) {}

  @Get()
  @CheckFeatures([RESOURCES.USER, ACTIONS.GET])
  @GetUserAPIDocs()
  async getUser(): Promise<CustomerProfileResponseDto> {
    return this.getUserUseCase.execute();
  }

  @Patch()
  @CheckFeatures([RESOURCES.USER, ACTIONS.PATCH])
  @PatchUserAPIDocs()
  async patchUser(@Body() patchUserDto: PatchUserDto) {
    return this.patchUserUseCase.execute(patchUserDto);
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
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User profile data retrieved successfully',
      type: CustomerProfileResponseDto,
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

function PatchUserAPIDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Update user information' }),
    ApiBody({ type: PatchUserDto }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User data updated successfully',
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized',
    }),
    ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Bad request' }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error',
    }),
  );
}
