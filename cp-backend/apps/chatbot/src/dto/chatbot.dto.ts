/**
 * Author: Assistant
 * Created on: 2025-08-07
 * Description: DTOs for Chatbot API
 * Module: Girl Scouts Chatbot
 * Copyright (c) 2024 Girl Scouts All rights reserved.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export enum ConversationStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export class ChatMessageDto {
  @ApiProperty({ description: 'User message to the chatbot' })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({ description: 'Session ID for conversation continuity (optional - will be created if not provided)' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({ description: 'User ID (optional)' })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class ChatResponseDto {
  @ApiProperty({ description: 'Chatbot response message' })
  response: string;

  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Whether the form is completed' })
  isCompleted: boolean;

  @ApiProperty({ description: 'Conversation status', enum: ConversationStatus })
  status: ConversationStatus;

  @ApiProperty({ description: 'Bedrock Agent session ID for continuity', required: false })
  agentSessionId?: string;
}

export class StartSessionDto {
  @ApiProperty({ description: 'Optional user identifier' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'Form type identifier', required: false })
  @IsOptional()
  @IsString()
  formType?: string;
}

export class SessionResponseDto {
  @ApiProperty({ description: 'New session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Welcome message from chatbot' })
  welcomeMessage: string;

  @ApiProperty({ description: 'Current question number' })
  currentQuestion: number;

  @ApiProperty({ description: 'Conversation status', enum: ConversationStatus })
  status: ConversationStatus;
}

export class SessionStatusDto {
  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Current question number' })
  currentQuestion: number;

  @ApiProperty({ description: 'Whether the form is completed' })
  isCompleted: boolean;

  @ApiProperty({ description: 'Conversation status', enum: ConversationStatus })
  status: ConversationStatus;

  @ApiProperty({ description: 'Collected form data', required: false })
  formData?: Record<string, any>;
}

export class FormDataDto {
  @ApiProperty({ description: 'Full name' })
  fullName?: string;

  @ApiProperty({ description: 'Email address' })
  email?: string;

  @ApiProperty({ description: 'Phone number' })
  phone?: string;

  @ApiProperty({ description: 'Age' })
  age?: string;

  @ApiProperty({ description: 'Preferred activity type' })
  preferredActivity?: string;
}
