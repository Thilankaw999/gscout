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
import { FormSubmissionService } from '../../services/form-submission.service';
import { ChatMessageDto, ChatResponseDto, ConversationStatus } from '../../dto/chatbot.dto';

@Injectable({ scope: Scope.REQUEST })
export class ProcessChatUseCase extends UseCase<ChatMessageDto, ChatResponseDto> {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly formSubmissionService: FormSubmissionService,
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

      // Process the message using Bedrock Agent (which handles conversation memory)
      const result = await this.conversationService.processMessage(sessionId, dto.message);
      
      // Check if form is completed and submit if necessary
      let submissionMessage = '';
      if (result.conversation.isCompleted && result.conversation.status === ConversationStatus.COMPLETED) {
        submissionMessage = await this.handleFormSubmission(sessionId, result.conversation.formData);
      }

      // Prepare response
      const response: ChatResponseDto = {
        response: submissionMessage ? `${result.response}\n\n${submissionMessage}` : result.response,
        sessionId: sessionId, // Use the actual sessionId (either provided or created)
        isCompleted: result.conversation.isCompleted,
        status: result.conversation.status,
        agentSessionId: result.conversation.agentSessionId,
      };

      this.logger.info('ProcessChatUseCase: Chat message processed successfully', {
        sessionId: sessionId,
        isCompleted: result.conversation.isCompleted,
        agentSessionId: result.conversation.agentSessionId,
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

  /**
   * Handle form submission when conversation is completed
   */
  private async handleFormSubmission(sessionId: string, formData: any): Promise<string> {
    try {
      this.logger.debug('ProcessChatUseCase: Submitting completed form', {
        sessionId,
      });

      const submissionResult = await this.formSubmissionService.submitFormData(
        sessionId,
        formData,
        'girl_scouts_application'
      );

      if (submissionResult.success) {
        return `🎉 Great news! Your application has been submitted successfully! Your submission ID is: ${submissionResult.submissionId}. Someone from our team will contact you soon at the email and phone number you provided.`;
      } else {
        return `⚠️ There was an issue submitting your application: ${submissionResult.message}. Please contact our support team for assistance.`;
      }

    } catch (error) {
      this.logger.error('ProcessChatUseCase: Form submission failed', {
        sessionId,
        error: error.message,
      });

      return `⚠️ We encountered a technical issue while submitting your application. Please contact our support team with your session ID: ${sessionId}`;
    }
  }

  /**
   * Provide hint about expected input for current question
   */
  private getExpectedInputHint(currentQuestion: number, isCompleted: boolean): string | undefined {
    if (isCompleted) {
      return undefined;
    }

    const hints = [
      'Please enter your full name',
      'Please enter a valid email address',
      'Please enter your phone number',
      'Please enter your age (5-18)',
      'Choose from: outdoor adventures, community service, STEM projects, arts & crafts, or leadership development'
    ];

    return hints[currentQuestion - 1];
  }
}
