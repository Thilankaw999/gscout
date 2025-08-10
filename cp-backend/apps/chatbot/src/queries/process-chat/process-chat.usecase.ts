/**
 * Author: Assistant
 * Created on: 2025-08-07
 * Description: Use case for processing chat messages
 * Module: Girl Scouts Chatbot
 * Copyright (c) 2024 Girl Scouts All rights reserved.
 */

import { Injectable, Scope, NotFoundException } from '@nestjs/common';
import { UseCase } from '@app/common';
import { Logger } from '@app/logger';
import { ConversationService } from '../../services/conversation.service';
import { ChatMessageDto, ChatResponseDto, ConversationStatus } from '../../dto/chatbot.dto';

@Injectable({ scope: Scope.REQUEST })
export class ProcessChatUseCase extends UseCase<ChatMessageDto, ChatResponseDto> {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly logger: Logger,
  ) {
    super();
  }

  async execute(dto: ChatMessageDto): Promise<ChatResponseDto> {
    try {
      this.logger.debug('ProcessChatUseCase: Processing chat message', {
        sessionId: dto.sessionId,
        userId: dto.userId,
        messageLength: dto.message.length,
      });

      let sessionId = dto.sessionId;
      
      // Auto-create session if not provided (since Bedrock Agent handles session management)
      if (!sessionId) {
        const conversation = await this.conversationService.createSession(dto.userId);
        sessionId = conversation.sessionId;
        this.logger.debug('ProcessChatUseCase: Auto-created new session', { sessionId });
      } else {
        // Validate session exists if provided
        const existingConversation = this.conversationService.getConversation(sessionId);
        if (!existingConversation) {
          // Create a new session with the provided ID
          await this.conversationService.createSession(dto.userId);
          this.logger.debug('ProcessChatUseCase: Created session with provided ID', { sessionId });
        }
      }

      // Process the message using Bedrock Agent (which handles conversation memory and form submission)
      const result = await this.conversationService.processMessage(sessionId, dto.message);

      // Prepare response
      const response: ChatResponseDto = {
        response: result.response,
        sessionId: sessionId, // Use the actual sessionId (either provided or created)
        isCompleted: result.conversation.isCompleted,
        status: result.conversation.status,
        agentSessionId: result.conversation.agentSessionId,
        submissionId: result.conversation.submissionId, // Include submission ID if form was submitted
      };

      this.logger.info('ProcessChatUseCase: Chat message processed successfully', {
        sessionId: sessionId,
        isCompleted: result.conversation.isCompleted,
        agentSessionId: result.conversation.agentSessionId,
        submissionId: result.conversation.submissionId,
      });

      return response;

    } catch (error) {
      this.logger.error('ProcessChatUseCase: Failed to process chat message', {
        sessionId: dto.sessionId || 'auto-generated',
        error: error.message,
      });
      throw error;
    }
  }
}
