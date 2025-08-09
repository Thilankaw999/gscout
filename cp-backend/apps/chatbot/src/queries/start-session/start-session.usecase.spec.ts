/**
 * Author: Assistant
 * Created on: 2025-08-07
 * Description: Unit tests for StartSessionUseCase
 * Module: Girl Scouts Chatbot
 * Copyright (c) 2024 Girl Scouts All rights reserved.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@app/logger';
import { StartSessionUseCase } from './start-session.usecase';
import { ConversationService } from '../../services/conversation.service';
import { ConversationStatus } from '../../dto/chatbot.dto';

describe('StartSessionUseCase', () => {
  let useCase: StartSessionUseCase;
  let conversationService: jest.Mocked<ConversationService>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    const mockConversationService = {
      createSession: jest.fn(),
      getWelcomeMessage: jest.fn(),
    };

    const mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartSessionUseCase,
        {
          provide: ConversationService,
          useValue: mockConversationService,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    useCase = module.get<StartSessionUseCase>(StartSessionUseCase);
    conversationService = module.get(ConversationService);
    logger = module.get(Logger);
  });

  describe('execute', () => {
    it('should create a new session successfully', async () => {
      // Arrange
      const dto = { userId: 'test-user', formType: 'application' };
      const mockConversation = {
        sessionId: 'gs_123_abc',
        currentQuestion: 1,
        isCompleted: false,
        status: ConversationStatus.ACTIVE,
        formData: {},
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockWelcomeMessage = "Hi there! I'm here to help you with your Girl Scouts application. What's your full name?";

      conversationService.createSession.mockResolvedValue(mockConversation);
      conversationService.getWelcomeMessage.mockResolvedValue(mockWelcomeMessage);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).toEqual({
        sessionId: 'gs_123_abc',
        welcomeMessage: mockWelcomeMessage,
        currentQuestion: 1,
        status: ConversationStatus.ACTIVE,
      });

      expect(conversationService.createSession).toHaveBeenCalledWith('test-user');
      expect(conversationService.getWelcomeMessage).toHaveBeenCalledWith('gs_123_abc');
      expect(logger.debug).toHaveBeenCalledWith(
        'StartSessionUseCase: Creating new chatbot session',
        { userId: 'test-user', formType: 'application' }
      );
      expect(logger.info).toHaveBeenCalledWith(
        'StartSessionUseCase: New session created successfully',
        { sessionId: 'gs_123_abc', userId: 'test-user' }
      );
    });

    it('should handle errors during session creation', async () => {
      // Arrange
      const dto = { userId: 'test-user' };
      const error = new Error('Failed to create session');

      conversationService.createSession.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow('Failed to create session');
      expect(logger.error).toHaveBeenCalledWith(
        'StartSessionUseCase: Failed to create session',
        { error: 'Failed to create session', userId: 'test-user' }
      );
    });
  });
});
