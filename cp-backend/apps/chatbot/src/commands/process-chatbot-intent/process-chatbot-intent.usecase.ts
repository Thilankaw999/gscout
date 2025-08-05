/**
 * process-chatbot-intent.usecase.ts
 * Author: Insurance Portal Development Team
 * Description: Processes chatbot intents and generates responses
 * Module: Insurance Property Portal Backend
 */

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UseCase } from '@app/common';
import { ChatbotIntentRepository, ClaimRepository, PropertyRepository } from '@app/db';
import { UserContextService } from '@app/user-context';
import { Logger } from '@app/logger';
import { ProcessChatbotIntentDto, ChatbotIntentResponseDto } from '../../dto/chatbot-intent.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProcessChatbotIntentUseCase extends UseCase<ProcessChatbotIntentDto, ChatbotIntentResponseDto> {
  constructor(
    private readonly userContextService: UserContextService,
    private readonly chatbotIntentRepository: ChatbotIntentRepository,
    private readonly claimRepository: ClaimRepository,
    private readonly propertyRepository: PropertyRepository,
    private readonly logger: Logger,
  ) {
    super();
  }

  async execute(input: ProcessChatbotIntentDto): Promise<ChatbotIntentResponseDto> {
    try {
      // Get user context from the request (populated by middleware)
      const userContext = this.userContextService.getUserContext();
      const { userId } = userContext;

      this.logger.debug('ProcessChatbotIntentUseCase: Starting intent processing', {
        userId,
        intent: input.intent,
        sessionId: input.sessionId,
      });

      // Validate that we have a valid user ID
      if (!userId || userId <= 0) {
        this.logger.error('ProcessChatbotIntentUseCase: Invalid user ID', { userId });
        throw new BadRequestException('Invalid user context');
      }

      // Generate session ID if not provided
      const sessionId = input.sessionId || uuidv4();

      // Process the intent and generate response
      const response = await this.processIntent(userId, input.intent, input.parameters);

      // Save the intent interaction to database
      await this.chatbotIntentRepository.create({
        userId,
        intent: input.intent,
        parameters: input.parameters,
        response,
        sessionId,
        confidence: 'high', // In a real implementation, this would come from an AI model
        processed: new Date(),
        createdBy: userContext.email || 'system',
        updatedBy: userContext.email || 'system',
      });

      this.logger.debug('ProcessChatbotIntentUseCase: Successfully processed intent', {
        userId,
        intent: input.intent,
        sessionId,
        responseLength: response.length,
      });

      return {
        response,
        sessionId,
        confidence: 'high',
        processedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('ProcessChatbotIntentUseCase: Error processing intent', {
        error: error.message,
        stack: error.stack,
        userId: this.userContextService.getUserId(),
        intent: input.intent,
      });

      // Re-throw the error if it's already a known exception
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // For database or other unexpected errors, throw a generic error
      throw new Error('Failed to process chatbot intent');
    }
  }

  private async processIntent(userId: number, intent: string, parameters: Record<string, any>): Promise<string> {
    switch (intent) {
      case 'ClaimStatusCheck':
        return await this.handleClaimStatusCheck(userId, parameters);
      
      case 'PolicyInquiry':
        return await this.handlePolicyInquiry(userId, parameters);
      
      case 'DocumentRequest':
        return await this.handleDocumentRequest(userId, parameters);

      case 'GeneralGreeting':
        return this.handleGeneralGreeting();

      case 'Help':
        return this.handleHelp();

      default:
        this.logger.warn('ProcessChatbotIntentUseCase: Unknown intent', { intent, userId });
        return 'I\'m sorry, I didn\'t understand your request. Could you please rephrase or ask about your policies, claims, or documents?';
    }
  }

  private async handleClaimStatusCheck(userId: number, parameters: Record<string, any>): Promise<string> {
    const claimId = parameters.claimId || parameters.claimNumber;
    
    if (!claimId) {
      return 'I need a claim number to check the status. Could you please provide your claim number?';
    }

    // Find the claim
    const claim = await this.claimRepository.findByClaimNumber(claimId);

    if (!claim || claim.userId !== userId) {
      return `I couldn't find a claim with number ${claimId}. Please check the claim number and try again.`;
    }

    const response = `Your claim ${claim.number} from ${claim.dateOfLoss?.toDateString() || 'N/A'} is currently in ${claim.progress}. ` +
      `${claim.adjusterName ? `The assigned adjuster is ${claim.adjusterName}, ` : ''}` +
      `${claim.estimatedResolutionDate ? `and the estimated resolution date is ${claim.estimatedResolutionDate.toDateString()}. ` : ''}` +
      `You can view your full claim details in the 'Claims' section.`;

    return response;
  }

  private async handlePolicyInquiry(userId: number, parameters: Record<string, any>): Promise<string> {
    const policyNumber = parameters.policyNumber;

    if (policyNumber) {
      const property = await this.propertyRepository.findByPolicyNumber(policyNumber);
      
      if (!property || property.userId !== userId) {
        return `I couldn't find a policy with number ${policyNumber}. Please check the policy number and try again.`;
      }

      return `Your policy ${property.policyNumber} for ${property.name} is currently ${property.status}. ` +
        `It covers ${property.address} with a coverage amount of $${property.coverageAmount || 'N/A'}. ` +
        `The policy is effective from ${property.effectiveDate?.toDateString() || 'N/A'} to ${property.expirationDate?.toDateString() || 'N/A'}. ` +
        `You can view more details in the 'Policies' section.`;
    } else {
      // General policy inquiry
      const properties = await this.propertyRepository.findActivePropertiesByUserId(userId);
      
      if (properties.length === 0) {
        return 'I don\'t see any active policies for your account. Please contact our support team if you believe this is an error.';
      }

      const policyCount = properties.length;
      const policyTypes = [...new Set(properties.map(p => p.type))].join(', ');
      
      return `You have ${policyCount} active ${policyCount === 1 ? 'policy' : 'policies'} covering ${policyTypes} properties. ` +
        `You can view all your policy details in the 'Policies' section of your dashboard.`;
    }
  }

  private async handleDocumentRequest(userId: number, parameters: Record<string, any>): Promise<string> {
    const documentType = parameters.documentType || parameters.type;

    if (documentType) {
      return `You can find your ${documentType} documents in the 'Documents' section of your dashboard. ` +
        `If you need a specific document, you can search by name or filter by document type.`;
    } else {
      return 'You can access all your insurance documents including policies, claims documentation, and assessments ' +
        'in the \'Documents\' section of your dashboard. You can also download any document you need from there.';
    }
  }

  private handleGeneralGreeting(): string {
    return 'Hello! I\'m here to help you with your insurance policies, claims, and documents. ' +
      'You can ask me about claim status, policy details, or where to find specific documents. How can I assist you today?';
  }

  private handleHelp(): string {
    return 'I can help you with:\n' +
      '• Check the status of your claims\n' +
      '• Get information about your policies\n' +
      '• Find and access your documents\n' +
      '• General questions about your insurance coverage\n\n' +
      'Just ask me a question and I\'ll do my best to help!';
  }
} 