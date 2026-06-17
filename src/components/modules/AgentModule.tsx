import { useState, useRef, useEffect, useCallback } from "react";
import { TOOLS, executeTool } from "@/lib/agent-tools";

/* ── Types ── */
interface ToolCall {
  id: string;
  function: { name: string; arguments: string };
}
interface Msg {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}
interface ChatBubble {
  id: string;
  role: "user" | "assistant" | "tool-log";
  text: string;
  toolName?: string;
  toolArgs?: string;
  toolResult?: string;
}

/* ── Consts ── */
const STORAGE_KEY = "grouvi_agent";
const DEFAULT_API = "";
const DEFAULT_MODEL = "llm7/gpt-4.1-nano";
const MAX_TOOL_ROUNDS = 8;

const SYSTEM_PROMPT = `Ты — Grouvi Agent, AI-ассистент встроенный в Grouvi Hub. Ты можешь выполнять действия на рабочем столе и управлять сервером.

Доступные возможности:
• Заметки — создавай, ищи, читай, удаляй заметки
• Карты — генерируй номера карт по BIN, проверяй BIN-инфо
• Почта — создавай временные email, проверяй входящие
• Веб — загружай содержимое URL
• OmniRoute — управляй провайдерами, моделями, API-ключами, настройками
• SSH — подключайся к VPS пользователя по его credentials, выполняй команды, управляй Docker

Правила:
1. Отвечай кратко и по делу
2. Если нужно выполнить действие — используй tools, не описывай "как бы ты это сделал"
3. После выполнения tool — сообщи результат пользователю
4. Отвечай на том языке, на котором пишет пользователь
5. SSH доступ — только к серверу пользователя, только после получения credentials. Не удаляй критичные файлы без подтверждения`;

/* ── SVG Icons ── */
const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);
const BotIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <line x1="12" y1="7" x2="12" y2="11" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);
const ToolIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);
const GearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .15s" }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/* ── Settings persistence ── */
interface AgentSettings {
  apiUrl: string;
  apiKey: string;
  model: string;
}
function loadSettings(): AgentSettings {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY + "_cfg") || "{}");
    return {
      apiUrl: s.apiUrl || DEFAULT_API,
      apiKey: s.apiKey || "",
      model: s.model || DEFAULT_MODEL,
    };
  } catch {
    return { apiUrl: DEFAULT_API, apiKey: "", model: DEFAULT_MODEL };
  }
}
function saveSettings(s: AgentSettings) {
  localStorage.setItem(STORAGE_KEY + "_cfg", JSON.stringify(s));
}

/* ══════════════════════════════════════════
   AgentModule — main component
   ══════════════════════════════════════════ */
export default function AgentModule() {
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cfg, setCfg] = useState<AgentSettings>(loadSettings);
  const [models, setModels] = useState<{ fullModel: string; name: string }[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // full message history for API calls
  const historyRef = useRef<Msg[]>([{ role: "system", content: SYSTEM_PROMPT }]);

  /* Auto-scroll */
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [bubbles]);

  /* Load models list */
  const fetchModels = useCallback(async () => {
    if (!cfg.apiKey) return;
    setModelsLoading(true);
    try {
      const r = await fetch(`${cfg.apiUrl}/api/models`, {
        headers: { Authorization: `Bearer ${cfg.apiKey}` },
      });
      if (r.ok) {
        const data = await r.json();
        setModels(data.models || []);
      }
    } catch { /* ignore */ }
    setModelsLoading(false);
  }, [cfg.apiUrl, cfg.apiKey]);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  /* Save settings on change */
  useEffect(() => { saveSettings(cfg); }, [cfg]);

  /* ── Add bubble helper ── */
  const addBubble = (b: Omit<ChatBubble, "id">) => {
    const bubble: ChatBubble = { ...b, id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5) };
    setBubbles((prev) => [...prev, bubble]);
    return bubble.id;
  };

  const updateBubble = (id: string, text: string) =>
    setBubbles((prev) => prev.map((b) => (b.id === id ? { ...b, text } : b)));

  /* ── Chat completion call (non-streaming for tool loop simplicity) ── */
  const callAPI = async (messages: Msg[], signal: AbortSignal): Promise<{ content: string | null; tool_calls?: ToolCall[] }> => {
    const r = await fetch(`${cfg.apiUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        tools: TOOLS,
        max_tokens: 4096,
        stream: false,
      }),
      signal,
    });
    if (!r.ok) {
      const err = await r.text();
      throw new Error(`API ${r.status}: ${err.slice(0, 200)}`);
    }
    const data = await r.json();
    const choice = data.choices?.[0];
    return {
      content: choice?.message?.content || null,
      tool_calls: choice?.message?.tool_calls?.length ? choice.message.tool_calls : undefined,
    };
  };

  /* ── Main send handler ── */
  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    if (!cfg.apiKey) {
      addBubble({ role: "assistant", text: "Введи API-ключ OmniRoute в настройках (шестерёнка)." });
      setShowSettings(true);
      return;
    }

    setInput("");
    setStreaming(true);
    addBubble({ role: "user", text });

    const abort = new AbortController();
    abortRef.current = abort;

    // Add user message to history
    historyRef.current.push({ role: "user", content: text });

    try {
      let rounds = 0;
      while (rounds < MAX_TOOL_ROUNDS) {
        rounds++;
        const result = await callAPI(historyRef.current, abort.signal);

        if (result.tool_calls && result.tool_calls.length > 0) {
          // Model wants to call tools
          const assistantMsg: Msg = {
            role: "assistant",
            content: result.content,
            tool_calls: result.tool_calls,
          };
          historyRef.current.push(assistantMsg);

          // Execute each tool
          for (const tc of result.tool_calls) {
            let args: Record<string, unknown> = {};
            try { args = JSON.parse(tc.function.arguments); } catch { /* */ }

            // Show tool call in chat
            const toolBubbleId = addBubble({
              role: "tool-log",
              text: "...",
              toolName: tc.function.name,
              toolArgs: JSON.stringify(args, null, 2),
            });

            const toolResult = await executeTool(tc.function.name, args);

            updateBubble(toolBubbleId, toolResult);

            // Add tool result to history
            historyRef.current.push({
              role: "tool",
              tool_call_id: tc.id,
              name: tc.function.name,
              content: toolResult,
            });
          }
          // Continue the loop — model will get tool results and may call more tools or respond
        } else {
          // Model responded with text (no more tools)
          const responseText = result.content || "(нет ответа)";
          addBubble({ role: "assistant", text: responseText });
          historyRef.current.push({ role: "assistant", content: responseText });
          break;
        }
      }
    } catch (e: unknown) {
      if ((e as Error).name !== "AbortError") {
        addBubble({ role: "assistant", text: `Ошибка: ${(e as Error).message}` });
      }
    }

    setStreaming(false);
    abortRef.current = null;
    inputRef.current?.focus();
  };

  /* ── Clear chat ── */
  const clearChat = () => {
    setBubbles([]);
    historyRef.current = [{ role: "system", content: SYSTEM_PROMPT }];
  };

  /* ── Key handler ── */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Render ── */
  return (
    <div className="flex flex-col h-full bg-[var(--g-bg)]" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-g-border2 shrink-0">
        <BotIcon />
        <span className="text-g-text font-semibold text-sm">Agent</span>
        <span className="text-g-text3 text-xs ml-1 truncate" style={{ maxWidth: 200 }}>
          {cfg.model}
        </span>
        <div className="flex-1" />
        <button onClick={clearChat} className="btn-icon" title="Очистить чат">
          <TrashIcon />
        </button>
        <button onClick={() => setShowSettings(!showSettings)} className="btn-icon" title="Настройки">
          <GearIcon />
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="px-3 py-2 border-b border-g-border2 space-y-2 shrink-0" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div>
            <label className="text-g-text3 text-xs block mb-1">API URL</label>
            <input
              className="w-full rounded-g px-2 py-1.5 text-xs text-g-text bg-transparent border border-g-border2 outline-none focus:border-g-accent/40 placeholder:text-g-text3/40 transition-colors"
              value={cfg.apiUrl}
              onChange={(e) => setCfg((s) => ({ ...s, apiUrl: e.target.value }))}
              placeholder="https://ai.grouvi.online"
            />
          </div>
          <div>
            <label className="text-g-text3 text-xs block mb-1">API Key</label>
            <input
              type="password"
              className="w-full rounded-g px-2 py-1.5 text-xs text-g-text bg-transparent border border-g-border2 outline-none focus:border-g-accent/40 placeholder:text-g-text3/40 transition-colors"
              value={cfg.apiKey}
              onChange={(e) => setCfg((s) => ({ ...s, apiKey: e.target.value }))}
              placeholder="sk-..."
            />
          </div>
          <div>
            <label className="text-g-text3 text-xs block mb-1">Модель</label>
            {models.length > 0 ? (
              <select
                className="w-full rounded-g px-2 py-1.5 text-xs text-g-text bg-g-panel2 border border-g-border2 outline-none cursor-pointer"
                value={cfg.model}
                onChange={(e) => setCfg((s) => ({ ...s, model: e.target.value }))}
              >
                {models.map((m) => (
                  <option key={m.fullModel} value={m.fullModel}>
                    {m.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="w-full rounded-g px-2 py-1.5 text-xs text-g-text bg-transparent border border-g-border2 outline-none focus:border-g-accent/40 placeholder:text-g-text3/40 transition-colors"
                value={cfg.model}
                onChange={(e) => setCfg((s) => ({ ...s, model: e.target.value }))}
                placeholder="llm7/gpt-4.1-nano"
              />
            )}
            {!modelsLoading && models.length === 0 && cfg.apiKey && (
              <button onClick={fetchModels} className="text-xs text-g-accent mt-1 hover:underline">
                Загрузить список моделей
              </button>
            )}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ minHeight: 0 }}>
        {bubbles.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-g-text3 text-sm gap-2 select-none">
            <BotIcon />
            <span>Grouvi Agent</span>
            <span className="text-xs max-w-[260px] text-center" style={{ lineHeight: 1.5 }}>
              Напиши задачу — создать заметку, сгенерировать карты, проверить почту...
            </span>
          </div>
        )}

        {bubbles.map((b) => {
          if (b.role === "user") {
            return (
              <div key={b.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-g px-3 py-2 text-sm text-g-text" style={{ background: "rgba(99,102,241,0.15)" }}>
                  <pre className="whitespace-pre-wrap font-sans m-0">{b.text}</pre>
                </div>
              </div>
            );
          }
          if (b.role === "tool-log") {
            return <ToolBubble key={b.id} name={b.toolName!} args={b.toolArgs!} result={b.text} />;
          }
          /* assistant */
          return (
            <div key={b.id} className="flex gap-2">
              <div className="shrink-0 mt-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(99,102,241,0.2)" }}>
                <BotIcon />
              </div>
              <div className="max-w-[85%] rounded-g px-3 py-2 text-sm text-g-text bg-g-panel2">
                <pre className="whitespace-pre-wrap font-sans m-0">{b.text}</pre>
              </div>
            </div>
          );
        })}

        {streaming && (
          <div className="flex gap-2 items-center text-g-text3 text-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--g-accent)] animate-pulse" />
            думаю...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-g-border2 px-3 py-2">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            className="flex-1 rounded-g px-3 py-2.5 text-sm text-g-text bg-transparent border border-g-border2 outline-none resize-none focus:border-g-accent/40 placeholder:text-g-text3/40 transition-colors"
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-resize
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={onKeyDown}
            placeholder="Напиши задачу..."
            disabled={streaming}
          />
          <button
            onClick={handleSend}
            disabled={streaming || !input.trim()}
            className="btn-primary px-3 py-2 rounded-g flex items-center justify-center disabled:opacity-30"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Tool execution bubble ── */
function ToolBubble({ name, args, result }: { name: string; args: string; result: string }) {
  const [open, setOpen] = useState(false);
  const isLoading = result === "...";
  const isError = result.includes('"error"');

  // Try to format result nicely
  let resultPreview = result;
  try {
    const parsed = JSON.parse(result);
    if (parsed.ok) resultPreview = "OK";
    else if (parsed.error) resultPreview = `Ошибка: ${parsed.error}`;
    else if (parsed.count !== undefined) resultPreview = `${parsed.count} шт.`;
    else if (parsed.cards) resultPreview = `${parsed.cards.length} карт`;
    else if (parsed.email) resultPreview = parsed.email;
    else resultPreview = result.slice(0, 60);
  } catch { resultPreview = result.slice(0, 60); }

  return (
    <div className="mx-2 rounded-g border border-g-border overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs hover:bg-white/5 transition-colors"
      >
        <ChevronIcon open={open} />
        <ToolIcon />
        <span className="text-g-text font-medium">{name}</span>
        <span className="flex-1" />
        {isLoading ? (
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        ) : (
          <span className={`truncate max-w-[180px] ${isError ? "text-red-400" : "text-g-text3"}`}>
            {resultPreview}
          </span>
        )}
      </button>
      {open && (
        <div className="px-3 py-2 border-t border-g-border text-xs space-y-1">
          <div>
            <span className="text-g-text3">args:</span>
            <pre className="font-mono text-g-code text-xs mt-0.5 p-1.5 rounded bg-g-panel2 overflow-x-auto">{args}</pre>
          </div>
          <div>
            <span className="text-g-text3">result:</span>
            <pre className="font-mono text-g-code text-xs mt-0.5 p-1.5 rounded bg-g-panel2 overflow-x-auto max-h-[200px] overflow-y-auto">
              {isLoading ? "выполняется..." : result}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
