import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiServiceUnavailableResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { AgentService } from './services/agent.service';
import { ConversationService } from './services/conversation.service';
import { ChatDto } from './dto/chat.dto';
import { LlmProviderFactory } from './providers/llm-provider.factory';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@ApiTags('AI Assistant')
@ApiBearerAuth('access-token')
@Controller('ai')
@UseGuards(AuthGuard)
export class AiController {
  constructor(
    private readonly agentService: AgentService,
    private readonly conversationService: ConversationService,
    private readonly llmFactory: LlmProviderFactory,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: 'Envoyer un message à l\'assistant financier' })
  @ApiOkResponse({ description: 'Réponse de l\'assistant avec actions éventuelles' })
  @ApiUnauthorizedResponse()
  @ApiServiceUnavailableResponse({ description: 'Configuration IA manquante ou erreur provider' })
  async chat(@Req() req: RequestWithUser, @Body() dto: ChatDto) {
    try {
      return await this.agentService.chat(req.user.userId, dto.message, dto.conversationId);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur assistant IA';
      throw new ServiceUnavailableException(message);
    }
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Lister les conversations récentes' })
  @ApiOkResponse()
  async listConversations(@Req() req: RequestWithUser) {
    return this.conversationService.listConversations(req.user.userId);
  }

  @Get('provider')
  @ApiOperation({ summary: 'Provider LLM actuellement configuré' })
  getProviderInfo() {
    try {
      const provider = this.llmFactory.create();
      return {
        provider: provider.providerId,
        configured: true,
      };
    } catch (e) {
      return {
        provider: null,
        configured: false,
        hint: e instanceof Error ? e.message : 'Non configuré',
      };
    }
  }
}
