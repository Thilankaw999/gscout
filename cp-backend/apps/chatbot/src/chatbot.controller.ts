/**
 * Author: Assistant
 * Created on: 2025-08-07
 * Description: Controller for Girl Scouts Chatbot API
 * Module: Girl Scouts Chatbot
 * Copyright (c) 2024 Girl Scouts All rights reserved.
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpStatus,
  applyDecorators,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { createSwaggerResponse } from '@app/common';
import {
  ChatMessageDto,
  ChatResponseDto,
  StartSessionDto,
  SessionResponseDto,
  SessionStatusDto,
} from './dto/chatbot.dto';
import { StartSessionUseCase } from './queries/start-session/start-session.usecase';
import { ProcessChatUseCase } from './queries/process-chat/process-chat.usecase';
import { GetSessionStatusUseCase } from './queries/get-session-status/get-session-status.usecase';

// Swagger decorators for API documentation
function StartSessionAPIDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Start a new chatbot conversation session',
      description: 'Creates a new conversation session and returns a welcome message',
    }),
    ApiBody({ type: StartSessionDto }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Session created successfully',
      type: SessionResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid request data',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error',
    }),
  );
}

function ProcessChatAPIDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Process a chat message',
      description: 'Send a message to the chatbot and receive a response',
    }),
    ApiBody({ type: ChatMessageDto }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Message processed successfully',
      type: ChatResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Session not found',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid message data',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error',
    }),
  );
}

function GetSessionStatusAPIDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get session status',
      description: 'Retrieve the current status and progress of a conversation session',
    }),
    ApiParam({
      name: 'sessionId',
      description: 'The session ID to check',
      example: 'gs_1625123456789_abc123def',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Session status retrieved successfully',
      type: SessionStatusDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Session not found',
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error',
    }),
  );
}

@Controller('chatbot')
@ApiTags('Girl Scouts Chatbot')
export class ChatbotController {
  constructor(
    private readonly processChatUseCase: ProcessChatUseCase,
    private readonly startSessionUseCase: StartSessionUseCase,
    private readonly getSessionStatusUseCase: GetSessionStatusUseCase,
  ) {}

  @Post('/chat')
  @ProcessChatAPIDocs()
  async processChat(@Body() dto: ChatMessageDto): Promise<ChatResponseDto> {
    return this.processChatUseCase.execute(dto);
  }

  @Post('/start-session')
  @StartSessionAPIDocs()
  async startSession(@Body() dto: StartSessionDto): Promise<SessionResponseDto> {
    return this.startSessionUseCase.execute(dto);
  }

  @Get('/session/:sessionId/status')
  @GetSessionStatusAPIDocs()
  async getSessionStatus(@Param('sessionId') sessionId: string): Promise<SessionStatusDto> {
    return this.getSessionStatusUseCase.execute(sessionId);
  }

  @Get('/health')
  @ApiOperation({
    summary: 'Health check endpoint',
    description: 'Check if the chatbot service is running',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        timestamp: { type: 'string', example: '2025-08-07T10:30:00.000Z' },
        service: { type: 'string', example: 'girl-scouts-chatbot' },
      },
    },
  })
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'girl-scouts-chatbot',
    };
  }
}
