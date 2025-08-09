/**
 * Author: Assistant
 * Created on: 2025-08-07
 * Description: Main module for Girl Scouts Chatbot
 * Module: Girl Scouts Chatbot
 * Copyright (c) 2024 Girl Scouts All rights reserved.
 */

import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { BaseAPIModule, CommonModule } from '@app/common';
import { DbModule } from '@app/db';

// Services
import { BedrockService } from './services/bedrock.service';
import { ConversationService } from './services/conversation.service';
import { FormSubmissionService } from './services/form-submission.service';

// Use Cases
import { StartSessionUseCase } from './queries/start-session/start-session.usecase';
import { ProcessChatUseCase } from './queries/process-chat/process-chat.usecase';
import { GetSessionStatusUseCase } from './queries/get-session-status/get-session-status.usecase';

@Module({
  imports: [
    BaseAPIModule,
    CommonModule,
    DbModule,
  ],
  controllers: [ChatbotController],
  providers: [
    // Services
    BedrockService,
    ConversationService,
    FormSubmissionService,
    
    // Use Cases
    StartSessionUseCase,
    ProcessChatUseCase,
    GetSessionStatusUseCase,
  ],
  exports: [
    BedrockService,
    ConversationService,
    FormSubmissionService,
  ],
})
export class ChatbotModule {}
