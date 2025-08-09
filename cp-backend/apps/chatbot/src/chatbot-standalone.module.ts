/**
 * Author: Assistant
 * Created on: 2025-08-08
 * Description: Standalone module for Girl Scouts Chatbot without database dependencies
 * Module: Girl Scouts Chatbot
 * Copyright (c) 2024 Girl Scouts All rights reserved.
 */

import { Module, Injectable } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ConfigProvider, HttpClientService, UseCase } from '@app/common';
import { Logger } from '@app/logger';

// Services
import { BedrockService } from './services/bedrock.service';
import { ConversationService } from './services/conversation.service';
import { FormSubmissionService } from './services/form-submission.service';

// Use Cases
import { StartSessionUseCase } from './queries/start-session/start-session.usecase';
import { ProcessChatUseCase } from './queries/process-chat/process-chat.usecase';
import { GetSessionStatusUseCase } from './queries/get-session-status/get-session-status.usecase';

// Simple logger for standalone mode - matches Logger interface from @app/logger
@Injectable()
class SimpleLogger {
  log(message: string, context?: string) {
    console.log(`[${context || 'App'}] ${message}`);
  }
  
  error(message: string, trace?: string, context?: string) {
    console.error(`[${context || 'App'}] ERROR: ${message}`, trace || '');
  }
  
  warn(message: string, context?: string) {
    console.warn(`[${context || 'App'}] WARN: ${message}`);
  }
  
  debug(message: string, context?: string) {
    console.debug(`[${context || 'App'}] DEBUG: ${message}`);
  }
  
  info(message: string, context?: string) {
    console.info(`[${context || 'App'}] INFO: ${message}`);
  }
}

@Module({
  imports: [
    // No database or complex modules - just the essentials
  ],
  controllers: [ChatbotController],
  providers: [
    // Core config
    ConfigProvider,
    
    // Simple logger - replace the Logger class with our simple implementation
    {
      provide: Logger,
      useClass: SimpleLogger,
    },
    
    // HTTP Client Service
    HttpClientService,
    
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
export class ChatbotModuleStandalone {}
