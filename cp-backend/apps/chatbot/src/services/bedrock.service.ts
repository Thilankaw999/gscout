/**
 * Author: Assistant
 * Created on: 2025-08-07
 * Description: AWS Bedrock service for Claude 3 Haiku integration
 * Module: Girl Scouts Chatbot
 * Copyright (c) 2024 Girl Scouts All rights reserved.
 */

import { Injectable } from '@nestjs/common';
import { Logger } from '@app/logger';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';

export interface BedrockMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BedrockResponse {
  content: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

@Injectable()
export class BedrockService {
  private client: BedrockRuntimeClient;
  private readonly modelId = 'apac.anthropic.claude-3-5-sonnet-20240620-v1:0';

  constructor(private readonly logger: Logger) {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'ap-south-1',
    });
  }

  /**
   * Invoke Claude 3 Haiku model with conversation context
   */
  async invokeModel(
    messages: BedrockMessage[],
    systemPrompt: string,
    maxTokens: number = 1000,
  ): Promise<BedrockResponse> {
    try {
      this.logger.debug('BedrockService: Invoking Claude 3 Haiku', {
        messageCount: messages.length,
        systemPromptLength: systemPrompt.length,
        maxTokens,
      });

      // Format messages for Claude 3
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: [{ type: 'text', text: msg.content }],
      }));

      const input: InvokeModelCommandInput = {
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: formattedMessages,
          temperature: 0.7,
          top_p: 0.9,
        }),
      };

      const command = new InvokeModelCommand(input);
      const response = await this.client.send(command);

      if (!response.body) {
        throw new Error('Empty response from Bedrock');
      }

      // Parse response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      this.logger.debug('BedrockService: Model response received', {
        contentLength: responseBody.content?.[0]?.text?.length || 0,
        usage: responseBody.usage,
      });

      return {
        content: responseBody.content?.[0]?.text || '',
        usage: responseBody.usage,
      };
    } catch (error) {
      this.logger.error('BedrockService: Error invoking model', {
        error: error.message,
        modelId: this.modelId,
      });
      throw new Error(`Failed to invoke Bedrock model: ${error.message}`);
    }
  }

  /**
   * Create a system prompt for the form-filling chatbot
   */
  createFormFillingSystemPrompt(): string {
    return `You are a friendly and helpful Girl Scouts form-filling assistant. Your role is to collect information from users through a conversational interface.

IMPORTANT RULES:
1. Ask ONE question at a time in a conversational, friendly manner
2. Wait for the user's response before proceeding to the next question
3. Be encouraging and supportive throughout the conversation
4. If a user provides unclear or incomplete information, politely ask for clarification
5. Keep responses concise but warm and friendly
6. Use Girl Scouts terminology and maintain the organization's positive, empowering tone

FORM QUESTIONS TO ASK (in this order):
1. Full Name: "Hi there! I'm here to help you with your Girl Scouts application. What's your full name?"
2. Email: "Great to meet you, [Name]! What's your email address so we can stay in touch?"
3. Phone: "Perfect! And what's the best phone number to reach you?"
4. Age: "Thanks! How old are you? This helps us match you with the right activities."
5. Preferred Activity: "Awesome! What type of Girl Scouts activities are you most interested in? (outdoor adventures, community service, STEM projects, arts & crafts, or leadership development)"

CONVERSATION FLOW:
- Start with a warm greeting and the first question
- After each answer, acknowledge their response positively before asking the next question
- When all 5 questions are answered, thank them and let them know their information will be processed
- If someone asks questions about Girl Scouts, provide helpful information but gently guide back to form completion

Remember: Be patient, encouraging, and maintain the Girl Scouts spirit of building girls of courage, confidence, and character!`;
  }
}
