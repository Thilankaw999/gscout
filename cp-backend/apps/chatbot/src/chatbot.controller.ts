/**
 * chatbot.controller.ts
 * Author: Insurance Portal Development Team
 * Description: Controller for chatbot operations
 * Module: Insurance Property Portal Backend
 */

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ACTIONS,
  CheckFeatures,
  FeaturesGuard,
  RESOURCES,
} from '@app/permissions';
import { ProcessChatbotIntentDto, ChatbotIntentResponseDto } from './dto/chatbot-intent.dto';
import { ProcessChatbotIntentUseCase } from './commands/process-chatbot-intent/process-chatbot-intent.usecase';

@Controller()
@ApiTags('Chatbot')
@UseGuards(FeaturesGuard)
export class ChatbotApiController {
  constructor(
    private readonly processChatbotIntentUseCase: ProcessChatbotIntentUseCase,
  ) {}

  @Post('intents')
  @CheckFeatures([RESOURCES.CHATBOT, ACTIONS.CREATE])
  @ApiOperation({ summary: 'Process chatbot intent' })
  @ApiResponse({
    status: 200,
    description: 'Chatbot intent processed successfully',
    type: ChatbotIntentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async processChatbotIntent(
    @Body() processChatbotIntentDto: ProcessChatbotIntentDto,
  ): Promise<ChatbotIntentResponseDto> {
    return await this.processChatbotIntentUseCase.execute(processChatbotIntentDto);
  }
} 