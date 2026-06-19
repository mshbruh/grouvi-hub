// ── Grouvi AI Types ──

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  artifacts?: Artifact[];
  timestamp: number;
  streaming?: boolean;
  tokenCount?: number;
}

export interface ToolCall {
  id: string;
  function: { name: string; arguments: string };
  result?: string;
}

export interface Artifact {
  id: string;
  type: "code" | "image" | "markdown" | "html";
  title: string;
  language?: string;
  content: string;
}

export interface AppSettings {
  apiKey: string;
  apiUrl: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  streamEnabled: boolean;
}

export interface ModelInfo {
  id: string;
  object?: string;
  owned_by?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: "sk-2490df48c5f63350-9f1a29-72d5fdbd",
  apiUrl: "",
  model: "llm7/gpt-4.1-nano",
  systemPrompt: "Ты — Grouvi AI, полезный AI-ассистент. Отвечай точно, структурировано, с примерами кода когда уместно.",
  temperature: 0.7,
  maxTokens: 4096,
  streamEnabled: true,
};
