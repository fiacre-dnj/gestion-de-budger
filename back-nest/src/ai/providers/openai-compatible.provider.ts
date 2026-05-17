import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  LlmCompletionRequest,
  LlmCompletionResponse,
  LlmMessage,
  LlmProvider,
} from './llm.types';

const DEFAULT_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  groq: 'https://api.groq.com/openai/v1',
  ollama: 'http://localhost:11434/v1',
  deepseek: 'https://api.deepseek.com/v1',
};

@Injectable()
export class OpenAiCompatibleProvider implements LlmProvider {
  readonly providerId: string;
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(
    private readonly configService: ConfigService,
    providerId: string,
  ) {
    this.providerId = providerId;
    const apiKey = this.configService.get<string>('AI_API_KEY', '');
    const baseURL =
      this.configService.get<string>('AI_BASE_URL') ||
      DEFAULT_BASE_URLS[providerId] ||
      DEFAULT_BASE_URLS.openai;

    this.client = new OpenAI({ apiKey, baseURL });
    this.model = this.configService.get<string>('AI_MODEL', 'llama-3.3-70b-versatile');
  }

  async complete(request: LlmCompletionRequest): Promise<LlmCompletionResponse> {
    const messages = request.messages.map((m) => this.toOpenAiMessage(m));

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages,
      tools: request.tools?.map((tool) => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      })),
      tool_choice: request.tools?.length ? 'auto' : undefined,
    });

    const choice = response.choices[0];
    const toolCalls = choice.message.tool_calls
      ?.filter((tc): tc is OpenAI.Chat.ChatCompletionMessageFunctionToolCall => tc.type === 'function')
      .map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: tc.function.arguments,
      }));

    return {
      content: choice.message.content,
      toolCalls,
      finishReason: toolCalls?.length ? 'tool_calls' : 'stop',
    };
  }

  private toOpenAiMessage(message: LlmMessage): OpenAI.Chat.ChatCompletionMessageParam {
    if (message.role === 'tool') {
      return {
        role: 'tool',
        tool_call_id: message.toolCallId!,
        content: message.content,
      };
    }
    if (message.role === 'assistant' && message.toolCalls?.length) {
      return {
        role: 'assistant',
        content: message.content || null,
        tool_calls: message.toolCalls.map((tc) => ({
          id: tc.id,
          type: 'function' as const,
          function: { name: tc.name, arguments: tc.arguments },
        })),
      };
    }
    return {
      role: message.role as 'system' | 'user' | 'assistant',
      content: message.content,
    };
  }
}
