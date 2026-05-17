import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider } from './llm.types';
import { OpenAiCompatibleProvider } from './openai-compatible.provider';
import { GeminiProvider } from './gemini.provider';

const OPENAI_COMPATIBLE = new Set(['openai', 'groq', 'ollama', 'deepseek']);

@Injectable()
export class LlmProviderFactory {
  private readonly logger = new Logger(LlmProviderFactory.name);

  constructor(private readonly configService: ConfigService) {}

  create(): LlmProvider {
    const providerId = this.configService.get<string>('AI_PROVIDER', 'groq').toLowerCase();

    if (!this.configService.get<string>('AI_API_KEY')) {
      throw new Error(
        'AI_API_KEY manquant. Obtenez une clé gratuite sur https://console.groq.com (provider groq) ou https://aistudio.google.com (provider gemini).',
      );
    }

    if (OPENAI_COMPATIBLE.has(providerId)) {
      this.logger.log(`LLM provider: ${providerId} (OpenAI-compatible API)`);
      return new OpenAiCompatibleProvider(this.configService, providerId);
    }

    if (providerId === 'gemini') {
      this.logger.log('LLM provider: gemini');
      return new GeminiProvider(this.configService);
    }

    throw new Error(
      `AI_PROVIDER "${providerId}" inconnu. Valeurs supportées: groq, openai, gemini, ollama, deepseek`,
    );
  }
}
