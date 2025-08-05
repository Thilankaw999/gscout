/**
 * Author: Roshan Piumal (roshan.piumal@mitrai.com)
 * Created on: 21/09/2024
 * Description: InvoiceApiModule
 * Module: LiSLS Boilerplate
 * Copyright (c) 2024 MitraAi All rights reserved.
 */

import { Module } from '@nestjs/common';
import { InvoiceApiController } from './invoice.controller';
import { BaseAPIModule } from '@app/common';
import { GetInvoiceUseCase } from './queries/get-invoice/get-invoice.usecase';
import { SearchInvoicesUseCase } from './queries/search-invoices/search-invoices.usecase';
import { CreateInvoiceUseCase } from './commands/create-einvoice/create-invoice.usecase';
import { DbModule } from '@app/db';
import { IntegrationsModule } from '@app/integrations';
import { S3Module } from '@app/aws/s3';

@Module({
  imports: [BaseAPIModule, DbModule, S3Module, IntegrationsModule],
  controllers: [InvoiceApiController],
  providers: [CreateInvoiceUseCase, GetInvoiceUseCase, SearchInvoicesUseCase],
})
export class InvoiceApiModule {}
