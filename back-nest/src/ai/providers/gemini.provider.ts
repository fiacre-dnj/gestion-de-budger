import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  FunctionCallingMode,
  SchemaType,
  type FunctionDeclaration,
  type Part,
} from '@google/generative-ai';
import {
  LlmCompletionRequest,
  LlmCompletionResponse,
  LlmMessage,
  LlmProvider,
  LlmToolDefinition,
} from './llm.types';

@Injectable()
export class GeminiProvider implements LlmProvider {
  readonly providerId = 'gemini';
  private readonly model: string;
  private readonly genAI: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('AI_API_KEY', '');
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.configService.get<string>('AI_MODEL', 'gemini-2.0-flash');
  }

  async complete(request: LlmCompletionRequest): Promise<LlmCompletionResponse> {
    const model = this.genAI.getGenerativeModel({
      model: this.model,
      tools: request.tools?.length
        ? [{ functionDeclarations: request.tools.map((t) => this.toGeminiTool(t)) }]
        : undefined,
      toolConfig: request.tools?.length
        ? { functionCallingConfig: { mode: FunctionCallingMode.AUTO } }
        : undefined,
    });

    const { systemInstruction, contents } = this.splitMessages(request.messages);
    const result = await model.generateContent({
      systemInstruction,
      contents,
    });

    const response = result.response;
    const functionCalls = response.functionCalls();

    if (functionCalls?.length) {
      return {
        content: null,
        toolCalls: functionCalls.map((fc, i) => ({
          id: `gemini_${Date.now()}_${i}`,
          name: fc.name,
          arguments: JSON.stringify(fc.args),
        })),
        finishReason: 'tool_calls',
      };
    }

    return {
      content: response.text(),
      finishReason: 'stop',
    };
  }

  private splitMessages(messages: LlmMessage[]) {
    const system = messages.find((m) => m.role === 'system');
    const contents: { role: string; parts: Part[] }[] = [];

    for (const msg of messages.filter((m) => m.role !== 'system')) {
      if (msg.role === 'tool') {
        contents.push({
          role: 'function',
          parts: [
            {
              functionResponse: {
                name: msg.name!,
                response: JSON.parse(msg.content || '{}'),
              },
            },
          ],
        });
        continue;
      }

      const role = msg.role === 'assistant' ? 'model' : 'user';
      contents.push({ role, parts: [{ text: msg.content }] });
    }

    return { systemInstruction: system?.content, contents };
  }

  private toGeminiTool(tool: LlmToolDefinition): FunctionDeclaration {
    const props = (tool.parameters as { properties?: Record<string, unknown> }).properties || {};
    const required = (tool.parameters as { required?: string[] }).required || [];

    const properties: Record<string, { type: SchemaType; description?: string }> = {};
    for (const [key, schema] of Object.entries(props)) {
      const s = schema as { type?: string; description?: string };
      properties[key] = {
        type: this.mapType(s.type),
        description: s.description,
      };
    }

    return {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: SchemaType.OBJECT,
        properties: properties as NonNullable<FunctionDeclaration['parameters']>['properties'],
        required,
      },
    };
  }

  private mapType(type?: string) {
    switch (type) {
      case 'integer':
        return SchemaType.INTEGER;
      case 'number':
        return SchemaType.NUMBER;
      case 'boolean':
        return SchemaType.BOOLEAN;
      default:
        return SchemaType.STRING;
    }
  }
}
