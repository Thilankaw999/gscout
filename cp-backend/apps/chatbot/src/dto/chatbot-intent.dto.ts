/**
 * chatbot-intent.dto.ts
 * Author: Insurance Portal Development Team
 * Description: DTOs for Chatbot Intent API endpoints
 * Module: Insurance Property Portal Backend
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsObject, IsOptional, ValidateNested } from 'class-validator';

export class ProcessChatbotIntentDto {
  @ApiProperty({ example: 'ClaimStatusCheck' })
  @IsString()
  intent: string;

  @ApiProperty({ 
    example: { claimId: 'CLM-98765-4321' },
    description: 'Intent parameters as key-value pairs'
  })
  @IsObject()
  parameters: Record<string, any>;

  @ApiPropertyOptional({ example: 'session-123-456' })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class ChatbotIntentResponseDto {
  @ApiProperty({ 
    example: 'Your claim from March 5, 2024 is currently in Adjuster Review. The assigned adjuster is John Smith, and the estimated resolution date is July 30, 2025. You can view your full claim in the \'Property Claims\' section.' 
  })
  response: string;

  @ApiPropertyOptional({ example: 'session-123-456' })
  sessionId?: string;

  @ApiPropertyOptional({ example: 'high' })
  confidence?: string;

  @ApiPropertyOptional({ example: '2024-03-10T15:30:00Z' })
  processedAt?: string;
} 