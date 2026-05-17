import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LlmMessage, LlmProvider } from '../providers/llm.types';
import { LLM_PROVIDER } from '../providers/llm.types';
import { AI_TOOL_DEFINITIONS } from '../tools/ai-tools.definitions';
import { AiToolsExecutor } from '../tools/ai-tools.executor';
import { normalizeToolArgs } from '../tools/ai-tools.utils';
import { ContextBuilderService } from './context-builder.service';
import { ConversationService } from './conversation.service';

const SYSTEM_PROMPT = `Tu es Stash Assistant, un conseiller financier personnel intégré à l'application Stash (gestion de budget).

Règles:
- Réponds toujours en français, de manière claire et bienveillante.
- Utilise les outils disponibles pour effectuer des actions (transactions, épargne, analyses) au lieu d'inventer des données.
- Avant une action importante (création de transaction, contribution épargne), résume ce que tu vas faire.
- Donne des conseils concrets basés sur les données réelles de l'utilisateur.
- Les montants sont dans la devise de l'utilisateur.
- Si une information manque (portefeuille, catégorie), liste les options disponibles via les outils.
- Pour les outils sans paramètre obligatoire, passe toujours un objet JSON vide {} — jamais null.
- N'appelle create_transaction ni add_saving_contribution que si l'utilisateur demande explicitement une action d'écriture.
- Pour donner des conseils, utilise get_financial_health, get_transactions_summary, list_wallets et list_saving_goals — pas create_transaction.
- Ne révèle jamais de secrets techniques ni de tokens.`;

export interface ChatResult {
  reply: string;
  conversationId: string;
  actions: { tool: string; success: boolean; summary?: string }[];
  provider: string;
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly maxIterations: number;

  constructor(
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
    private readonly toolsExecutor: AiToolsExecutor,
    private readonly contextBuilder: ContextBuilderService,
    private readonly conversationService: ConversationService,
    private readonly configService: ConfigService,
  ) {
    this.maxIterations = this.configService.get<number>('AI_MAX_TOOL_ITERATIONS', 5);
  }

  async chat(userId: string, message: string, conversationId?: string): Promise<ChatResult> {
    const conversation = await this.conversationService.findOrCreate(userId, conversationId);
    const convId = conversation._id.toString();

    await this.conversationService.addMessage(convId, 'user', message);

    if (conversation.title === 'Nouvelle conversation') {
      await this.conversationService.updateTitle(convId, message);
    }

    const history = await this.conversationService.getMessages(convId);
    const financialContext = await this.contextBuilder.build(userId);

    const messages: LlmMessage[] = [
      {
        role: 'system',
        content: `${SYSTEM_PROMPT}\n\nContexte financier actuel:\n${financialContext}`,
      },
      ...history
        .filter((m) => m.role !== 'tool')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
    ];

    const actions: ChatResult['actions'] = [];
    let finalReply = '';

    for (let i = 0; i < this.maxIterations; i++) {
      const response = await this.llm.complete({
        messages,
        tools: AI_TOOL_DEFINITIONS,
      });

      if (response.finishReason === 'tool_calls' && response.toolCalls?.length) {
        messages.push({
          role: 'assistant',
          content: response.content || '',
          toolCalls: response.toolCalls,
        });

        for (const toolCall of response.toolCalls) {
          let result: unknown;
          let success = true;
          let summary = '';

          try {
            const args = normalizeToolArgs(toolCall.arguments);
            result = await this.toolsExecutor.execute(userId, toolCall.name, args);
            summary = this.summarizeToolResult(toolCall.name, result);
          } catch (err) {
            success = false;
            const errorMessage = err instanceof Error ? err.message : String(err);
            result = { error: errorMessage };
            summary = errorMessage;
            this.logger.warn(`Tool ${toolCall.name} failed: ${errorMessage}`);
          }

          // N'afficher que les outils réellement invoqués (pas les échecs silencieux vides)
          if (success || summary) {
            actions.push({ tool: toolCall.name, success, summary });
          }

          const resultContent = JSON.stringify(result);
          messages.push({
            role: 'tool',
            toolCallId: toolCall.id,
            name: toolCall.name,
            content: resultContent,
          });

          await this.conversationService.addMessage(convId, 'tool', resultContent, {
            tool: toolCall.name,
            success,
          });
        }
        continue;
      }

      finalReply = response.content || 'Je n\'ai pas pu générer de réponse.';
      break;
    }

    if (!finalReply) {
      finalReply = 'J\'ai effectué les actions demandées. Souhaitez-vous autre chose ?';
    }

    await this.conversationService.addMessage(convId, 'assistant', finalReply);

    return {
      reply: finalReply,
      conversationId: convId,
      actions,
      provider: this.llm.providerId,
    };
  }

  private summarizeToolResult(toolName: string, result: unknown): string {
    if (!result || typeof result !== 'object') return this.toolLabel(toolName);
    const r = result as Record<string, unknown>;
    if (r.error) return String(r.error);
    if (toolName === 'create_transaction' && r.title) {
      return `Transaction « ${r.title} » créée`;
    }
    if (toolName === 'add_saving_contribution' && r.title) {
      return `Contribution enregistrée pour « ${r.title} »`;
    }
    if (Array.isArray(result)) {
      return `${this.toolLabel(toolName)} (${result.length} élément${result.length > 1 ? 's' : ''})`;
    }
    return this.toolLabel(toolName);
  }

  private toolLabel(toolName: string): string {
    const labels: Record<string, string> = {
      list_wallets: 'Portefeuilles récupérés',
      list_categories: 'Catégories récupérées',
      get_transactions_summary: 'Résumé des transactions',
      list_saving_goals: 'Objectifs d\'épargne récupérés',
      get_monthly_analysis: 'Analyse mensuelle',
      get_financial_health: 'Santé financière analysée',
    };
    return labels[toolName] ?? 'Données récupérées';
  }
}
