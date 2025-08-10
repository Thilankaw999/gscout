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
import { FormSubmissionService, FormSubmissionResponse } from './form-submission.service';

export interface ConversationState {
  sessionId: string;
  agentSessionId?: string; // Bedrock Agent's session ID for native memory
  currentQuestion: number; // Current question number (managed by Bedrock Agent)
  isCompleted: boolean; // Completion status (managed by Bedrock Agent)
  status: ConversationStatus;
  formData: Partial<FormDataDto>; // Form data (managed by Bedrock Agent)
  submissionId?: string; // Form submission ID if submitted
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
    private readonly formSubmissionService: FormSubmissionService,
  ) {
    this.agentId = process.env.BEDROCK_AGENT_ID || "6ZMA6GLFKM";
    this.agentAliasId = process.env.BEDROCK_AGENT_ALIAS_ID || "ECLUMRWGPX";
    
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
      submissionId: undefined, // Will be set when form is successfully submitted
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
      submissionId: undefined,
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

      // Check if Bedrock Agent indicates form completion and handle submission
      const formCompletionResult = await this.handleFormCompletion(
        conversation,
        responseText,
        userMessage
      );

      if (formCompletionResult.isCompleted) {
        responseText = formCompletionResult.finalResponse;
        conversation.isCompleted = true;
        conversation.status = ConversationStatus.COMPLETED;
        if (formCompletionResult.submissionId) {
          conversation.submissionId = formCompletionResult.submissionId;
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

  /**
   * Handle form completion detection and submission
   */
  private async handleFormCompletion(
    conversation: ConversationState,
    agentResponse: string,
    userMessage: string
  ): Promise<{
    isCompleted: boolean;
    finalResponse: string;
    submissionId?: string;
  }> {
    // Check if agent response indicates form completion
    const completionIndicators = [
      'thank you for completing',
      'form completed',
      'all information collected',
      'application submitted',
      'registration complete',
      'thank you for your application'
    ];

    const isFormCompleted = completionIndicators.some(indicator =>
      agentResponse.toLowerCase().includes(indicator)
    );

    if (!isFormCompleted) {
      return {
        isCompleted: false,
        finalResponse: agentResponse,
      };
    }

    try {
      // Extract form data from the agent's conversation memory
      const extractedFormData = await this.extractFormDataFromAgent(conversation);
      
      // Submit the form data
      const submissionResult = await this.formSubmissionService.submitFormData(
        conversation.sessionId,
        extractedFormData,
        'girl_scouts_application'
      );

      if (submissionResult.success) {
        const finalResponse = `${agentResponse}\n\n✅ Great news! Your application has been successfully submitted with ID: ${submissionResult.submissionId}. You will receive a confirmation email shortly.`;
        
        this.logger.info('ConversationService: Form submitted successfully', {
          sessionId: conversation.sessionId,
          submissionId: submissionResult.submissionId,
        });

        return {
          isCompleted: true,
          finalResponse,
          submissionId: submissionResult.submissionId,
        };
      } else {
        const errorResponse = `${agentResponse}\n\n⚠️ There was an issue submitting your application: ${submissionResult.message}. Please contact support if this problem persists.`;
        
        return {
          isCompleted: true,
          finalResponse: errorResponse,
        };
      }
    } catch (error) {
      this.logger.error('ConversationService: Error during form submission', {
        sessionId: conversation.sessionId,
        error: error.message,
      });

      const errorResponse = `${agentResponse}\n\n⚠️ We encountered a technical issue while submitting your application. Please contact our support team with your session ID: ${conversation.sessionId}`;
      
      return {
        isCompleted: true,
        finalResponse: errorResponse,
      };
    }
  }

  /**
   * Extract form data from Bedrock Agent's conversation memory
   * This method attempts to parse the collected information from the agent's responses
   */
  private async extractFormDataFromAgent(conversation: ConversationState): Promise<Partial<FormDataDto>> {
    try {
      // Request a summary of collected information from the agent
      const summaryRequest: InvokeAgentCommandInput = {
        agentId: this.agentId,
        agentAliasId: this.agentAliasId,
        sessionId: conversation.agentSessionId || conversation.sessionId,
        inputText: "Please provide a structured summary of all the form information collected in this conversation in JSON format: {fullName, email, phone, age, preferredActivity}",
        enableTrace: false,
      };

      const command = new InvokeAgentCommand(summaryRequest);
      const response = await this.bedrockAgentClient.send(command);

      let responseText = '';
      if (response.completion) {
        for await (const chunk of response.completion) {
          if (chunk.chunk?.bytes) {
            const chunkText = new TextDecoder().decode(chunk.chunk.bytes);
            responseText += chunkText;
          }
        }
      }

      // Try to parse JSON from the response
      const jsonMatch = responseText.match(/\{[^}]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        
        // Validate and clean the parsed data
        return {
          fullName: parsedData.fullName?.trim(),
          email: parsedData.email?.trim(),
          phone: parsedData.phone?.trim(),
          age: parsedData.age?.toString().trim(),
          preferredActivity: parsedData.preferredActivity?.trim(),
        };
      }

      // Fallback: extract data using regex patterns from the response
      return this.extractFormDataWithRegex(responseText);

    } catch (error) {
      this.logger.warn('ConversationService: Failed to extract structured data from agent, using fallback', {
        sessionId: conversation.sessionId,
        error: error.message,
      });

      // Return empty form data - the form submission service will validate and provide appropriate errors
      return {};
    }
  }

  /**
   * Fallback method to extract form data using regex patterns
   */
  private extractFormDataWithRegex(text: string): Partial<FormDataDto> {
    const formData: Partial<FormDataDto> = {};

    // Extract email
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      formData.email = emailMatch[0];
    }

    // Extract phone number
    const phoneMatch = text.match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
    if (phoneMatch) {
      formData.phone = phoneMatch[0];
    }

    // Extract age (look for numbers between 5-18)
    const ageMatch = text.match(/\b(1[0-8]|[5-9])\b/);
    if (ageMatch) {
      formData.age = ageMatch[0];
    }

    // For name and activity, we'd need more sophisticated NLP or rely on the agent's structured response
    // These could be extracted from conversation context if needed

    return formData;
  }

  /**
   * Get form submission status for a completed session
   */
  async getFormSubmissionStatus(sessionId: string): Promise<{
    isSubmitted: boolean;
    submissionId?: string;
    timestamp?: Date;
  }> {
    const conversation = this.getConversation(sessionId);
    
    if (!conversation) {
      throw new Error('Session not found');
    }

    return {
      isSubmitted: !!conversation.submissionId,
      submissionId: conversation.submissionId,
      timestamp: conversation.updatedAt,
    };
  }

  /**
   * Test if the form submission service is available
   */
  async testFormSubmissionService(): Promise<boolean> {
    try {
      return await this.formSubmissionService.testConnection();
    } catch (error) {
      this.logger.error('ConversationService: Form submission service test failed', {
        error: error.message,
      });
      return false;
    }
  }
}
