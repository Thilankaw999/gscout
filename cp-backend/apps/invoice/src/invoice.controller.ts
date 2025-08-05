/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: InvoiceApiController
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import {
  applyDecorators,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
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
  ApiBody,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InvoiceApiModule } from './invoice.module';
import {
  PaginatedInvoicesDto,
  SearchInvoicesInputDto,
} from './dto/search-invoices.dto';
import { InvoiceDto } from './dto/get-invoice.dto';
import { GetInvoiceUseCase } from './queries/get-invoice/get-invoice.usecase';
import { SearchInvoicesUseCase } from './queries/search-invoices/search-invoices.usecase';
import {
  CreateInvoiceDto,
  CreateInvoiceResponseDto,
} from './dto/create-invoice.dto';
import { CreateInvoiceUseCase } from './commands/create-einvoice/create-invoice.usecase';
import { Logger } from '@app/logger';

@Controller('invoice')
@ApiTags('Invoice')
@UseGuards(FeaturesGuard)
export class InvoiceApiController {
  constructor(
    private readonly _logger: Logger,
    private readonly getInvoiceUseCase: GetInvoiceUseCase,
    private readonly searchInvoicesUseCase: SearchInvoicesUseCase,
    private readonly createInvoiceUseCase: CreateInvoiceUseCase,
  ) {}

  @Get('search')
  @CheckFeatures([RESOURCES.INVOICE, ACTIONS.SEARCH])
  @GetInvoiceSearchAPIDocs()
  async getInvoices(
    @Query() searchInvoicesDto: SearchInvoicesInputDto,
  ): Promise<PaginatedInvoicesDto> {
    return this.searchInvoicesUseCase.execute(searchInvoicesDto);
  }

  @Get(':invoiceKey')
  @GetInvoiceAPIDocs()
  @CheckFeatures([RESOURCES.INVOICE, ACTIONS.GET])
  async getInvoice(
    @Param('invoiceKey') invoiceKey: string,
  ): Promise<InvoiceDto> {
    return this.getInvoiceUseCase.execute(invoiceKey);
  }

  @Post()
  @GetCreateInvoiceAPIDcos()
  @CheckFeatures([RESOURCES.INVOICE, ACTIONS.CREATE])
  async createInvoice(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.createInvoiceUseCase.execute(createInvoiceDto);
  }

  @Get('/docs/swagger.json')
  @ApiExcludeEndpoint()
  async getSwaggerJson(@Res() res) {
    return createSwaggerResponse(
      res,
      InvoiceApiModule,
      'Invoice API',
      'Invoice API Documentation',
    );
  }
}

function GetInvoiceAPIDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get a single invoice by invoiceKey',
    }),
    ApiParam({
      name: 'invoiceKey',
      description: 'Unique identifier for the invoice',
      type: String,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Invoice retrieved successfully',
      type: InvoiceDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Invoice not found',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error',
    }),
  );
}

function GetInvoiceSearchAPIDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a paginated list of invoices' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'A paginated list of invoices',
      type: PaginatedInvoicesDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error',
    }),
  );
}

function GetCreateInvoiceAPIDcos() {
  return applyDecorators(
    ApiOperation({ summary: 'Create an e-invoice' }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'The invoice has been successfully created.',
      type: CreateInvoiceResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Bad Request.',
    }),
    ApiBody({ type: CreateInvoiceDto }),
  );
}
