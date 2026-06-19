import type { Agent, FeedMessage, Task } from "./types";

const API_BASE = "/agent-api";

async function apiFetch(path: string, opts?: RequestInit) {
  const r = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts?.headers || {}) },
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`API ${r.status}: ${text.slice(0, 200)}`);
  }
  return r.json();
}

export async function fetchAgents(): Promise<Agent[]> {
  const data = await apiFetch("/api/agents");
  return data.agents;
}

export async function fetchAgent(id: string) {
  return apiFetch(`/api/agent/${id}`);
}

export async function chatWithAgent(
  agentId: string,
  message: string,
  model?: string
): Promise<{ agentId: string; content: string }> {
  return apiFetch(`/api/agent/${agentId}/chat`, {
    method: "POST",
    body: JSON.stringify({ message, model }),
  });
}

export async function clearAgentMemory(agentId: string) {
  return apiFetch(`/api/agent/${agentId}/clear`, { method: "POST" });
}

export async function submitTeamTask(
  task: string,
  model?: string
): Promise<{ taskId: string }> {
  return apiFetch("/api/team/task", {
    method: "POST",
    body: JSON.stringify({ task, model }),
  });
}

export async function fetchTasks(): Promise<Task[]> {
  const data = await apiFetch("/api/tasks");
  return data.tasks;
}

export async function fetchTask(id: string): Promise<Task> {
  return apiFetch(`/api/task/${id}`);
}

export async function fetchFeedHistory(): Promise<FeedMessage[]> {
  const data = await apiFetch("/api/feed/history");
  return data.messages;
}

export function subscribeFeed(onMessage: (msg: FeedMessage) => void): () => void {
  const es = new EventSource(`${API_BASE}/api/feed`);
  es.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      onMessage(msg);
    } catch {}
  };
  es.onerror = () => {
    // Reconnect after 3s
    setTimeout(() => {
      es.close();
      subscribeFeed(onMessage);
    }, 3000);
  };
  return () => es.close();
}
