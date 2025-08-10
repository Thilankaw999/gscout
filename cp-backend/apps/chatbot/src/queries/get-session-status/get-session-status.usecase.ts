/**
 * Author: Assistant
 * Created on: 2025-08-07
 * Description: Use case for getting session status
 * Module: Girl Scouts Chatbot
 * Copyright (c) 2024 Girl Scouts All rights reserved.
 */

import { Injectable, Scope, NotFoundException } from '@nestjs/common';
import { UseCase } from '@app/common';
import { Logger } from '@app/logger';
import { ConversationService } from '../../services/conversation.service';
import { SessionStatusDto } from '../../dto/chatbot.dto';

@Injectable({ scope: Scope.REQUEST })
export class GetSessionStatusUseCase extends UseCase<string, SessionStatusDto> {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly logger: Logger,
  ) {
    super();
  }

  async execute(sessionId: string): Promise<SessionStatusDto> {
    try {
      this.logger.debug('GetSessionStatusUseCase: Getting session status', {
        sessionId,
      });

      // Get conversation state
      const conversation = this.conversationService.getConversation(sessionId);
      
      if (!conversation) {
        throw new NotFoundException(`Session ${sessionId} not found`);
      }

      const response: SessionStatusDto = {
        sessionId: conversation.sessionId,
        currentQuestion: conversation.currentQuestion,
        isCompleted: conversation.isCompleted,
        status: conversation.status,
        formData: conversation.isCompleted ? conversation.formData : undefined,
        submissionId: conversation.submissionId, // Include submission ID if available
      };

      this.logger.debug('GetSessionStatusUseCase: Session status retrieved', {
        sessionId,
        currentQuestion: conversation.currentQuestion,
        isCompleted: conversation.isCompleted,
      });

      return response;

    } catch (error) {
      this.logger.error('GetSessionStatusUseCase: Failed to get session status', {
        sessionId,
        error: error.message,
      });
      throw error;
    }
  }
}
