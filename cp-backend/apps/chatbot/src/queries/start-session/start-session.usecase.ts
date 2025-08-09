/**
 * Author: Assistant
 * Created on: 2025-08-07
 * Description: Use case for starting a new chatbot conversation session
 * Module: Girl Scouts Chatbot
 * Copyright (c) 2024 Girl Scouts All rights reserved.
 */

import { Injectable, Scope } from '@nestjs/common';
import { UseCase } from '@app/common';
import { Logger } from '@app/logger';
import { ConversationService } from '../../services/conversation.service';
import { SessionResponseDto, StartSessionDto, ConversationStatus } from '../../dto/chatbot.dto';

@Injectable({ scope: Scope.REQUEST })
export class StartSessionUseCase extends UseCase<StartSessionDto, SessionResponseDto> {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly logger: Logger,
  ) {
    super();
  }

  async execute(dto: StartSessionDto): Promise<SessionResponseDto> {
    try {
      this.logger.debug('StartSessionUseCase: Creating new chatbot session', {
        userId: dto.userId,
        formType: dto.formType,
      });

      // Create new conversation session
      const conversation = await this.conversationService.createSession(dto.userId);

      // Generate welcome message
      const welcomeMessage = await this.conversationService.getWelcomeMessage(conversation.sessionId);

      const response: SessionResponseDto = {
        sessionId: conversation.sessionId,
        welcomeMessage,
        currentQuestion: conversation.currentQuestion,
        status: conversation.status,
      };

      this.logger.info('StartSessionUseCase: New session created successfully', {
        sessionId: conversation.sessionId,
        userId: dto.userId,
      });

      return response;

    } catch (error) {
      this.logger.error('StartSessionUseCase: Failed to create session', {
        error: error.message,
        userId: dto.userId,
      });
      throw error;
    }
  }
}
