/**
 * Author: Assistant
 * Created on: 2025-08-07
 * Description: Conversation service for managing chatbot state and memory
 * Module: Girl Scouts Chatbot
 * Copyright (c) 2024 Girl Scouts All rights reserved.
 */

import { Injectable } from '@nestjs/common';
import { Logger } from '@app/logger';
import { ConversationStatus, FormDataDto } from '../dto/chatbot.dto';
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
  InvokeAgentCommandInput,
} from '@aws-sdk/client-bedrock-agent-runtime';

export interface ConversationState {
  sessionId: string;
  agentSessionId?: string; // Bedrock Agent's session ID for native memory
  currentQuestion: number; // Current question number (managed by Bedrock Agent)
  isCompleted: boolean; // Completion status (managed by Bedrock Agent)
  status: ConversationStatus;
  formData: Partial<FormDataDto>; // Form data (managed by Bedrock Agent)
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ConversationService {
  private readonly bedrockAgentClient: BedrockAgentRuntimeClient;
  private readonly agentId: string;
  private readonly agentAliasId: string;

  constructor(
    private readonly logger: Logger,
  ) {
    this.agentId = process.env.BEDROCK_AGENT_ID || "6ZMA6GLFKM";
    this.agentAliasId = process.env.BEDROCK_AGENT_ALIAS_ID || "XGX3SPXVCS";
    
    this.bedrockAgentClient = new BedrockAgentRuntimeClient({
      region: process.env.AWS_REGION || 'ap-south-1',
    });
  }

  /**
   * Create a new conversation session
   */
  async createSession(userId?: string): Promise<ConversationState> {
    const sessionId = this.generateSessionId();
    
    const conversation: ConversationState = {
      sessionId,
      currentQuestion: 0, // Start with question 0 (introduction/welcome)
      isCompleted: false,
      status: ConversationStatus.ACTIVE,
      formData: {},
      agentSessionId: null, // Will be set when first Bedrock agent conversation is initiated
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.logger.debug('ConversationService: New session created', {
      sessionId,
      userId,
    });

    return conversation;
  }

  /**
   * Get conversation state by session ID
   * Creates a minimal state object since Bedrock Agent handles the actual memory
   */
  getConversation(sessionId: string): ConversationState | null {
    if (!sessionId) {
      return null;
    }
    
    // Create a minimal conversation state - Bedrock Agent handles everything
    return {
      sessionId,
      agentSessionId: sessionId,
      currentQuestion: 0,
      isCompleted: false,
      status: ConversationStatus.ACTIVE,
      formData: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Process user message and generate chatbot response using Bedrock Agent with native memory
   */
  async processMessage(sessionId: string, userMessage: string): Promise<{
    response: string;
    conversation: ConversationState;
  }> {
    const conversation = this.getConversation(sessionId);
    
    if (!conversation) {
      throw new Error('Session not found');
    }

    try {
      // Use Bedrock Agent with native memory capabilities
      const invokeAgentRequest: InvokeAgentCommandInput = {
        agentId: this.agentId,
        agentAliasId: this.agentAliasId,
        sessionId: conversation.agentSessionId || conversation.sessionId,
        inputText: userMessage,
        enableTrace: true, // Enable for debugging
      };

      const command = new InvokeAgentCommand(invokeAgentRequest);
      const response = await this.bedrockAgentClient.send(command);
      
      // Store the agent session ID for future requests
      if (response.sessionId && !conversation.agentSessionId) {
        conversation.agentSessionId = response.sessionId;
      }
      
      // Extract the response text from the agent response
      let responseText = '';
      if (response.completion) {
        for await (const chunk of response.completion) {
          if (chunk.chunk?.bytes) {
            const chunkText = new TextDecoder().decode(chunk.chunk.bytes);
            responseText += chunkText;
          }
        }
      }

      // Update conversation timestamp
      conversation.updatedAt = new Date();

      this.logger.debug('ConversationService: Message processed with Bedrock Agent native memory', {
        sessionId,
        agentSessionId: conversation.agentSessionId,
      });

      return {
        response: responseText || 'I apologize, but I encountered an issue. Please try again.',
        conversation,
      };

    } catch (error) {
      this.logger.error('ConversationService: Error processing message with Bedrock Agent', {
        sessionId,
        agentId: this.agentId,
        agentAliasId: this.agentAliasId,
        error: error.message,
        errorCode: error.name,
      });
      
      // Handle specific Bedrock Agent errors
      if (error.name === 'ValidationException') {
        this.logger.error('Bedrock Agent ValidationException - check agent ID and request format', { error });
      } else if (error.name === 'AccessDeniedException') {
        this.logger.error('Bedrock Agent AccessDeniedException - check IAM permissions', { error });
      } else if (error.name === 'ThrottlingException') {
        this.logger.error('Bedrock Agent ThrottlingException - rate limited', { error });
      } else if (error.name === 'ResourceNotFoundException') {
        this.logger.error('Bedrock Agent ResourceNotFoundException - check agent exists', { error });
      }
      
      conversation.status = ConversationStatus.FAILED;
      
      throw error;
    }
  }

  /**
   * Get initial welcome message for new session using Bedrock Agent
   */
  async getWelcomeMessage(sessionId: string): Promise<string> {
    const welcomePrompt = "Please provide the initial greeting and first question to start the Girl Scouts form-filling process.";

    try {
      // Use Bedrock Agent for welcome message
      const conversation = this.getConversation(sessionId);
      if (!conversation) {
        throw new Error('Session not found');
      }

      const invokeAgentRequest: InvokeAgentCommandInput = {
        agentId: this.agentId,
        agentAliasId: this.agentAliasId,
        sessionId: conversation.agentSessionId || conversation.sessionId,
        inputText: welcomePrompt,
        enableTrace: false, // Disable trace for welcome message
      };

      const command = new InvokeAgentCommand(invokeAgentRequest);
      const agentResponse = await this.bedrockAgentClient.send(command);
      
      // Store the agent session ID for future requests
      if (agentResponse.sessionId && !conversation.agentSessionId) {
        conversation.agentSessionId = agentResponse.sessionId;
      }
      
      // Extract the response text from the agent response
      let responseText = '';
      if (agentResponse.completion) {
        for await (const chunk of agentResponse.completion) {
          if (chunk.chunk?.bytes) {
            const chunkText = new TextDecoder().decode(chunk.chunk.bytes);
            responseText += chunkText;
          }
        }
      }
      
      return responseText || 'Hi there! I\'m here to help you with your Girl Scouts application. What\'s your full name?';
    } catch (error) {
      this.logger.error('ConversationService: Error generating welcome message with Bedrock Agent', {
        sessionId,
        agentId: this.agentId,
        error: error.message,
      });
      
      // Fallback welcome message
      const fallbackMessage = "Hi there! I'm here to help you with your Girl Scouts application. What's your full name?";
      return fallbackMessage;
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `gs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
