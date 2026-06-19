import React, { useState, useCallback, useEffect, useRef } from "react";

/* ── Types ── */
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  created: number;
}

interface OmniConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
}

type View = "setup" | "chat" | "sessions" | "settings";

/* ── Storage helpers ── */
const STORAGE_KEY = "grouvi_ai_config";
const SESSIONS_KEY = "grouvi_ai_sessions";

function loadConfig(): OmniConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveConfig(cfg: OmniConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

/* ── Simple markdown-ish renderer ── */
function renderContent(text: string) {
  // Split by code blocks
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith("```")) {
      const lines = part.slice(3, -3).split("\n");
      const lang = lines[0]?.trim() || "";
      const code = lang ? lines.slice(1).join("\n") : lines.join("\n");
      return (
        <div key={i} className="my-2 rounded-md overflow-hidden border border-g-border2">
          {lang && (
            <div className="px-3 py-1 bg-g-panel2 text-[10px] text-g-text3 font-mono border-b border-g-border2">
              {lang}
            </div>
          )}
          <pre className="p-3 bg-g-bg2 text-[12px] text-g-text font-mono overflow-x-auto leading-relaxed whitespace-pre">
            {code}
          </pre>
        </div>
      );
    }
    // Inline formatting
    const formatted = part
      .split(/(`[^`]+`)/g)
      .map((seg, j) => {
        if (seg.startsWith("`") && seg.endsWith("`")) {
          return (
            <code
              key={j}
              className="px-1.5 py-0.5 rounded bg-g-panel2 text-g-code text-[12px] font-mono"
            >
              {seg.slice(1, -1)}
            </code>
          );
        }
        // Bold
        const bolded = seg.split(/(\*\*[^*]+\*\*)/g).map((s, k) => {
          if (s.startsWith("**") && s.endsWith("**")) {
            return (
              <strong key={k} className="font-semibold text-g-text">
                {s.slice(2, -2)}
              </strong>
            );
          }
          return s;
        });
        return <React.Fragment key={j}>{bolded}</React.Fragment>;
      });
    return (
      <span key={i} className="whitespace-pre-wrap">
        {formatted}
      </span>
    );
  });
}

/* ── Copy helper ── */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {}
}

export default function AiChatModule() {
  const [view, setView] = useState<View>("setup");
  const [config, setConfig] = useState<OmniConfig>({
    endpoint: "",
    apiKey: "",
    model: "auto",
    systemPrompt: "",
  });
  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState("");

  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* ── Init ── */
  useEffect(() => {
    const saved = loadConfig();
    if (saved) {
      setConfig(saved);
      setSessions(loadSessions());
      setView("chat");
    }
  }, []);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, streamText]);

  /* ── Normalize endpoint ── */
  const baseUrl = config.endpoint.replace(/\/+$/, "").replace(/\/v1\/?$/, "");

  /* ── Test connection ── */
  const testConnection = useCallback(async () => {
    setTestStatus("testing");
    try {
      const r = await fetch(baseUrl + "/v1/models", {
        headers: config.apiKey
          ? { Authorization: "Bearer " + config.apiKey }
          : {},
      });
      if (!r.ok) throw new Error("" + r.status);
      const data = await r.json();
      const modelList: string[] = (data.data || [])
        .map((m: { id?: string }) => m.id)
        .filter(Boolean)
        .sort();
      setModels(modelList);
      setTestStatus("ok");
    } catch {
      setTestStatus("fail");
      setModels([]);
    }
  }, [baseUrl, config.apiKey]);

  /* ── Fetch models ── */
  const fetchModels = useCallback(async () => {
    setModelsLoading(true);
    try {
      const r = await fetch(baseUrl + "/v1/models", {
        headers: config.apiKey
          ? { Authorization: "Bearer " + config.apiKey }
          : {},
      });
      if (r.ok) {
        const data = await r.json();
        const modelList: string[] = (data.data || [])
          .map((m: { id?: string }) => m.id)
          .filter(Boolean)
          .sort();
        setModels(modelList);
      }
    } catch {}
    setModelsLoading(false);
  }, [baseUrl, config.apiKey]);

  /* ── Save & connect ── */
  const handleConnect = useCallback(() => {
    saveConfig(config);
    setSessions(loadSessions());
    setView("chat");
    fetchModels();
  }, [config, fetchModels]);

  /* ── New session ── */
  const newSession = useCallback(() => {
    const session: ChatSession = {
      id: "s_" + Date.now(),
      title: "новый диалог",
      messages: [],
      model: config.model,
      created: Date.now(),
    };
    setActiveSession(session);
    setSessions((prev) => {
      const updated = [session, ...prev];
      saveSessions(updated);
      return updated;
    });
    setInput("");
    setError("");
  }, [config.model]);

  /* ── Send message ── */
  const sendMessage = useCallback(async () => {
    if (!input.trim() || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    let session = activeSession;

    if (!session) {
      session = {
        id: "s_" + Date.now(),
        title: userMsg.content.slice(0, 40),
        messages: [],
        model: config.model,
        created: Date.now(),
      };
    }

    // Update title from first message
    if (session.messages.length === 0) {
      session = { ...session, title: userMsg.content.slice(0, 40) };
    }

    const updatedMessages = [...session.messages, userMsg];
    session = { ...session, messages: updatedMessages };
    setActiveSession(session);
    setInput("");
    setError("");
    setStreaming(true);
    setStreamText("");

    // Build messages array for API
    const apiMessages: ChatMessage[] = [];
    if (config.systemPrompt.trim()) {
      apiMessages.push({ role: "system", content: config.systemPrompt.trim() });
    }
    apiMessages.push(...updatedMessages);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const r = await fetch(baseUrl + "/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.apiKey ? { Authorization: "Bearer " + config.apiKey } : {}),
        },
        body: JSON.stringify({
          model: session.model || config.model,
          messages: apiMessages,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!r.ok) {
        const errData = await r.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: { message?: string } }).error?.message ||
            `HTTP ${r.status}`
        );
      }

      const reader = r.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullText += delta;
              setStreamText(fullText);
            }
          } catch {}
        }
      }

      // Finalize
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: fullText,
      };
      const finalSession: ChatSession = {
        ...session,
        messages: [...updatedMessages, assistantMsg],
      };
      setActiveSession(finalSession);
      setSessions((prev) => {
        const updated = prev.map((s) =>
          s.id === finalSession.id ? finalSession : s
        );
        if (!prev.find((s) => s.id === finalSession.id)) {
          updated.unshift(finalSession);
        }
        saveSessions(updated);
        return updated;
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") {
        // User cancelled
      } else {
        setError(e instanceof Error ? e.message : "Ошибка запроса");
      }
    }

    setStreaming(false);
    setStreamText("");
    abortRef.current = null;
  }, [input, streaming, activeSession, config, baseUrl]);

  /* ── Stop streaming ── */
  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  /* ── Delete session ── */
  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const updated = prev.filter((s) => s.id !== id);
        saveSessions(updated);
        return updated;
      });
      if (activeSession?.id === id) {
        setActiveSession(null);
      }
    },
    [activeSession]
  );

  /* ════════════════════════════════════════
     SETUP VIEW
     ════════════════════════════════════════ */
  if (view === "setup") {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="ic-xl text-g-text3 mb-4">
            <svg viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-g-text mb-1">AI Chat</h2>
          <p className="text-[13px] text-g-text3 mb-6 text-center max-w-[360px]">
            Подключите OmniRoute или любой OpenAI-совместимый API.
          </p>

          <div className="w-full max-w-[400px] space-y-3">
            {/* Endpoint */}
            <div>
              <label className="block text-[11px] text-g-text3 mb-1 font-mono">
                ENDPOINT
              </label>
              <input
                type="text"
                value={config.endpoint}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, endpoint: e.target.value }))
                }
                placeholder="http://localhost:20128"
                className="w-full bg-transparent px-3 py-2.5 text-[13px] text-g-text font-mono placeholder:text-g-text3/40 outline-none rounded-g border border-g-border2 focus:border-g-accent/40 transition-colors"
              />
            </div>

            {/* API Key */}
            <div>
              <label className="block text-[11px] text-g-text3 mb-1 font-mono">
                API KEY
              </label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, apiKey: e.target.value }))
                }
                placeholder="sk-... (необязательно)"
                className="w-full bg-transparent px-3 py-2.5 text-[13px] text-g-text font-mono placeholder:text-g-text3/40 outline-none rounded-g border border-g-border2 focus:border-g-accent/40 transition-colors"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-[11px] text-g-text3 mb-1 font-mono">
                MODEL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, model: e.target.value }))
                  }
                  placeholder="auto"
                  className="flex-1 bg-transparent px-3 py-2.5 text-[13px] text-g-text font-mono placeholder:text-g-text3/40 outline-none rounded-g border border-g-border2 focus:border-g-accent/40 transition-colors"
                />
              </div>
            </div>

            {/* System prompt */}
            <div>
              <label className="block text-[11px] text-g-text3 mb-1 font-mono">
                SYSTEM PROMPT (необязательно)
              </label>
              <textarea
                value={config.systemPrompt}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, systemPrompt: e.target.value }))
                }
                placeholder="You are a helpful assistant..."
                rows={2}
                className="w-full bg-transparent px-3 py-2.5 text-[13px] text-g-text font-mono placeholder:text-g-text3/40 outline-none rounded-g border border-g-border2 focus:border-g-accent/40 transition-colors resize-none"
              />
            </div>

            {/* Test + Connect */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={testConnection}
                disabled={testStatus === "testing"}
                className="btn-icon border border-g-border2 px-3 py-2 text-[12px] text-g-text3 font-mono hover:text-g-text"
              >
                {testStatus === "testing" ? (
                  <span className="w-4 h-4 border-2 border-g-text3/30 border-t-g-text3 rounded-full animate-spin" />
                ) : testStatus === "ok" ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-g-green" />
                    {models.length} моделей
                  </span>
                ) : testStatus === "fail" ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-g-red" />
                    ошибка
                  </span>
                ) : (
                  "тест"
                )}
              </button>
              <button onClick={handleConnect} className="btn-primary flex-1">
                Подключить
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     SETTINGS VIEW
     ════════════════════════════════════════ */
  if (view === "settings") {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2.5 border-b border-g-border flex items-center gap-2 shrink-0">
          <button
            onClick={() => setView("chat")}
            className="btn-icon"
            title="Назад"
          >
            <span className="ic-sm">
              <svg viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </span>
          </button>
          <span className="text-[13px] text-g-text font-medium">Настройки</span>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          <div>
            <label className="block text-[11px] text-g-text3 mb-1 font-mono">
              ENDPOINT
            </label>
            <input
              type="text"
              value={config.endpoint}
              onChange={(e) =>
                setConfig((c) => ({ ...c, endpoint: e.target.value }))
              }
              className="w-full bg-transparent px-3 py-2.5 text-[13px] text-g-text font-mono outline-none rounded-g border border-g-border2 focus:border-g-accent/40 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] text-g-text3 mb-1 font-mono">
              API KEY
            </label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) =>
                setConfig((c) => ({ ...c, apiKey: e.target.value }))
              }
              className="w-full bg-transparent px-3 py-2.5 text-[13px] text-g-text font-mono outline-none rounded-g border border-g-border2 focus:border-g-accent/40 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] text-g-text3 mb-1 font-mono">
              MODEL
            </label>
            {models.length > 0 ? (
              <select
                value={config.model}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, model: e.target.value }))
                }
                className="w-full bg-g-panel2 px-3 py-2.5 text-[13px] text-g-text font-mono outline-none rounded-g border border-g-border2 cursor-pointer"
              >
                <option value="auto">auto</option>
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={config.model}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, model: e.target.value }))
                }
                className="w-full bg-transparent px-3 py-2.5 text-[13px] text-g-text font-mono outline-none rounded-g border border-g-border2 focus:border-g-accent/40 transition-colors"
              />
            )}
          </div>
          <div>
            <label className="block text-[11px] text-g-text3 mb-1 font-mono">
              SYSTEM PROMPT
            </label>
            <textarea
              value={config.systemPrompt}
              onChange={(e) =>
                setConfig((c) => ({ ...c, systemPrompt: e.target.value }))
              }
              rows={3}
              className="w-full bg-transparent px-3 py-2.5 text-[13px] text-g-text font-mono outline-none rounded-g border border-g-border2 focus:border-g-accent/40 transition-colors resize-none"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                saveConfig(config);
                fetchModels();
                setView("chat");
              }}
              className="btn-primary flex-1"
            >
              Сохранить
            </button>
            <button
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(SESSIONS_KEY);
                setConfig({
                  endpoint: "",
                  apiKey: "",
                  model: "auto",
                  systemPrompt: "",
                });
                setSessions([]);
                setActiveSession(null);
                setView("setup");
              }}
              className="btn-icon border border-g-red/30 text-g-red px-3 py-2 text-[12px] font-mono hover:bg-g-red/10"
            >
              Сбросить
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     SESSIONS VIEW
     ════════════════════════════════════════ */
  if (view === "sessions") {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-2.5 border-b border-g-border flex items-center gap-2 shrink-0">
          <button
            onClick={() => setView("chat")}
            className="btn-icon"
            title="Назад"
          >
            <span className="ic-sm">
              <svg viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </span>
          </button>
          <span className="text-[13px] text-g-text font-medium flex-1">
            Диалоги
          </span>
          <button
            onClick={() => {
              newSession();
              setView("chat");
            }}
            className="btn-icon"
            title="Новый диалог"
          >
            <span className="ic-sm">
              <svg viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-5 select-none">
              <div className="text-[13px] text-g-text3 mb-1">Нет диалогов</div>
              <div className="text-[11px] text-g-text3/60">
                Начните новый диалог
              </div>
            </div>
          ) : (
            <ul>
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-g-border cursor-pointer hover:bg-[rgba(255,255,255,.02)] active:bg-[rgba(255,255,255,.05)] transition-colors ${
                    activeSession?.id === s.id ? "bg-[rgba(255,255,255,.04)]" : ""
                  }`}
                  onClick={() => {
                    setActiveSession(s);
                    setView("chat");
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-g-text truncate">
                      {s.title}
                    </div>
                    <div className="text-[11px] text-g-text3 mt-0.5">
                      {s.messages.length} сообщ. · {s.model}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(s.id);
                    }}
                    className="btn-icon shrink-0"
                    title="Удалить"
                  >
                    <span className="ic-sm text-g-text3 hover:text-g-red">
                      <svg viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     CHAT VIEW
     ════════════════════════════════════════ */
  const msgs = activeSession?.messages || [];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-2 border-b border-g-border flex items-center gap-2 shrink-0">
        <button
          onClick={() => setView("sessions")}
          className="btn-icon"
          title="Диалоги"
        >
          <span className="ic-sm">
            <svg viewBox="0 0 24 24">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </span>
        </button>

        <span className="text-[12px] text-g-text font-mono truncate flex-1">
          {activeSession?.title || "AI Chat"}
        </span>

        {/* Model selector (compact) */}
        {models.length > 0 ? (
          <select
            value={activeSession?.model || config.model}
            onChange={(e) => {
              const m = e.target.value;
              setConfig((c) => ({ ...c, model: m }));
              saveConfig({ ...config, model: m });
              if (activeSession) {
                const updated = { ...activeSession, model: m };
                setActiveSession(updated);
                setSessions((prev) => {
                  const list = prev.map((s) =>
                    s.id === updated.id ? updated : s
                  );
                  saveSessions(list);
                  return list;
                });
              }
            }}
            className="bg-g-panel2 px-2 py-1 text-[10px] text-g-text3 font-mono rounded border border-g-border2 outline-none cursor-pointer max-w-[140px]"
          >
            <option value="auto">auto</option>
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-[10px] text-g-text3 font-mono">
            {config.model}
          </span>
        )}

        <button
          onClick={newSession}
          className="btn-icon"
          title="Новый диалог"
        >
          <span className="ic-sm">
            <svg viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
        </button>

        <button
          onClick={() => setView("settings")}
          className="btn-icon"
          title="Настройки"
        >
          <span className="ic-sm">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-4 py-3">
        {msgs.length === 0 && !streaming ? (
          <div className="flex flex-col items-center justify-center h-full select-none">
            <div className="ic-xl text-g-text3/20 mb-3">
              <svg viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="text-[13px] text-g-text3 mb-1">
              Начните диалог
            </div>
            <div className="text-[11px] text-g-text3/60">
              Введите сообщение ниже
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {msgs.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-g2 text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-g-accent/10 border border-g-accent/20 text-g-text"
                      : "bg-g-panel2 border border-g-border2 text-g-text2"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="ai-response">
                      {renderContent(msg.content)}
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => copyText(msg.content)}
                      className="btn-icon mt-1 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                      title="Копировать"
                      style={{ opacity: undefined }}
                      onMouseEnter={(e) =>
                        ((e.target as HTMLElement).style.opacity = "1")
                      }
                      onMouseLeave={(e) =>
                        ((e.target as HTMLElement).style.opacity = "0")
                      }
                    >
                      <span className="ic-sm">
                        <svg viewBox="0 0 24 24">
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming response */}
            {streaming && streamText && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-3.5 py-2.5 rounded-g2 text-[13px] leading-relaxed bg-g-panel2 border border-g-border2 text-g-text2">
                  <div className="ai-response">
                    {renderContent(streamText)}
                  </div>
                </div>
              </div>
            )}

            {/* Streaming indicator */}
            {streaming && !streamText && (
              <div className="flex justify-start">
                <div className="px-3.5 py-2.5 rounded-g2 bg-g-panel2 border border-g-border2">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-g-text3 animate-pulse" />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-g-text3 animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-g-text3 animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 border-t border-g-red/20 bg-g-red/5 text-[12px] text-g-red font-mono shrink-0">
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="px-4 py-3 border-t border-g-border shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Сообщение..."
            rows={1}
            className="flex-1 bg-transparent px-3 py-2.5 text-[13px] text-g-text placeholder:text-g-text3/40 outline-none rounded-g border border-g-border2 focus:border-g-accent/40 transition-colors resize-none max-h-[120px]"
            style={{
              height: "auto",
              minHeight: "40px",
            }}
            disabled={streaming}
            autoFocus
          />
          {streaming ? (
            <button
              onClick={stopStreaming}
              className="btn-icon border border-g-red/30 text-g-red shrink-0"
              title="Остановить"
            >
              <span className="ic-sm">
                <svg viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
              </span>
            </button>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="btn-icon border border-g-border2 shrink-0 disabled:opacity-30"
              title="Отправить"
            >
              <span className="ic-sm">
                <svg viewBox="0 0 24 24">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
