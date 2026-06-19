// ── Grouvi AI Streaming API ──
import { AppSettings, Message, ModelInfo } from "./types";

export async function fetchModels(settings: AppSettings): Promise<ModelInfo[]> {
  try {
    const base = settings.apiUrl || "";
    const res = await fetch(`${base}/v1/models`, {
      headers: settings.apiKey ? { Authorization: `Bearer ${settings.apiKey}` } : {},
    });
    if (!res.ok) return [];
    const json = await res.json();
    const list = json?.data ?? json;
    if (!Array.isArray(list)) return [];
    return list;
  } catch {
    return [];
  }
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

export async function streamChat(
  messages: { role: string; content: string }[],
  settings: AppSettings,
  callbacks: StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const base = settings.apiUrl || "";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (settings.apiKey) headers["Authorization"] = `Bearer ${settings.apiKey}`;

  const body = {
    model: settings.model,
    messages,
    stream: settings.streamEnabled,
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
  };

  try {
    const res = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "Unknown error");
      callbacks.onError(`HTTP ${res.status}: ${err}`);
      return;
    }

    if (!settings.streamEnabled) {
      const json = await res.json();
      const text = json.choices?.[0]?.message?.content || "";
      callbacks.onToken(text);
      callbacks.onDone(text);
      return;
    }

    // SSE streaming
    const reader = res.body?.getReader();
    if (!reader) {
      callbacks.onError("No stream reader");
      return;
    }

    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            callbacks.onToken(delta);
          }
        } catch {
          // skip malformed
        }
      }
    }

    callbacks.onDone(fullText);
  } catch (e: any) {
    if (e.name === "AbortError") {
      callbacks.onDone("");
    } else {
      callbacks.onError(e.message || "Network error");
    }
  }
}

export function autoTitle(firstMessage: string): string {
  const clean = firstMessage.replace(/\n/g, " ").trim();
  if (clean.length <= 40) return clean;
  return clean.slice(0, 37) + "...";
}
