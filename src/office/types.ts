export interface Agent {
  id: string;
  name: string;
  role: string;
  emoji: string;
  color: string;
  goal: string;
  description: string;
  toolCount: number;
  messageCount: number;
  status?: "idle" | "busy" | "error";
  lastActivity?: string;
  lastActivityTs?: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface FeedMessage {
  ts: number;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  agentRole: string;
  type: "thinking" | "message" | "tool_call" | "tool_result" | "delegate" | "error" | "task_update";
  content: string;
  taskId?: string;
}

export interface Task {
  id: string;
  text: string;
  status: "active" | "completed" | "failed";
  steps: TaskStep[];
  result: string | null;
  createdAt: number;
  completedAt?: number;
}

export interface TaskStep {
  agentId: string;
  agentName: string;
  task: string;
  result: string;
}

export type ViewMode = "office" | "chat" | "task" | "duet-keys";
