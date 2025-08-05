/**
 * chatbot.module.ts
 * Author: Insurance Portal Development Team
 * Description: Module to handle chatbot operations in Insurance Property Portal
 * Module: Insurance Property Portal Backend
 */

import { Module } from '@nestjs/common';
import { BaseAPIModule } from '@app/common';
import { DbModule } from '@app/db';
import { ChatbotApiController } from './chatbot.controller';

// Use Cases
import { ProcessChatbotIntentUseCase } from './commands/process-chatbot-intent/process-chatbot-intent.usecase';

@Module({
  imports: [BaseAPIModule, DbModule],
  controllers: [ChatbotApiController],
  providers: [
    ProcessChatbotIntentUseCase,
  ],
  exports: [],
})
export class ChatbotApiModule {} 