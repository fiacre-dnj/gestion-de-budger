export type LlmRole = 'system' | 'user' | 'assistant' | 'tool';

export interface LlmMessage {
  role: LlmRole;
  content: string;
  toolCallId?: string;
  name?: string;
  toolCalls?: LlmToolCall[];
}

export interface LlmToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LlmToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface LlmCompletionRequest {
  messages: LlmMessage[];
  tools?: LlmToolDefinition[];
}

export interface LlmCompletionResponse {
  content: string | null;
  toolCalls?: LlmToolCall[];
  finishReason: 'stop' | 'tool_calls';
}

export interface LlmProvider {
  readonly providerId: string;
  complete(request: LlmCompletionRequest): Promise<LlmCompletionResponse>;
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
