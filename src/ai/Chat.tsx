// ── Grouvi AI Chat Panel ──
import React, { useState, useRef, useEffect, useCallback } from "react";
import type { Message, Artifact, AppSettings, Conversation } from "./types";
import { Markdown, extractArtifacts } from "./markdown";
import { streamChat, autoTitle } from "./api";
import { uid } from "./store";

interface Props {
  conversation: Conversation | null;
  settings: AppSettings;
  onUpdate: (conv: Conversation) => void;
  onArtifact: (a: Artifact) => void;
  onOpenSettings: () => void;
  onOpenDetail: () => void;
  onNewChat: () => void;
  detailOpen: boolean;
}

function UserAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-[#F4EDE4] flex items-center justify-center flex-shrink-0 mt-0.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    </div>
  );
}

function AiAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center flex-shrink-0 mt-0.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
    </div>
  );
}

const SUGGESTIONS = [
  { icon: "💡", text: "Объясни концепцию", prompt: "Объясни простыми словами как работает " },
  { icon: "🧑‍💻", text: "Напиши код", prompt: "Напиши пример кода на Python для " },
  { icon: "📊", text: "Анализ данных", prompt: "Проанализируй и структурируй следующие данные:\n\n" },
  { icon: "✍️", text: "Помоги с текстом", prompt: "Помоги написать/отредактировать текст:\n\n" },
];

export function Chat({ conversation, settings, onUpdate, onArtifact, onOpenSettings, onOpenDetail, onNewChat, detailOpen }: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [conversation?.messages.length, streamText]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + "px";
    }
  }, [input]);

  // Focus input when conversation changes
  useEffect(() => {
    if (conversation && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [conversation?.id]);

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    if (!conversation) { onNewChat(); return; }
    if (!settings.apiKey) { onOpenSettings(); return; }

    const userMsg: Message = { id: uid(), role: "user", content: msg, timestamp: Date.now() };
    const newMessages = [...conversation.messages, userMsg];
    const isFirst = conversation.messages.length === 0;

    const updated: Conversation = {
      ...conversation,
      messages: newMessages,
      updatedAt: Date.now(),
      title: isFirst ? autoTitle(msg) : conversation.title,
    };
    onUpdate(updated);
    setInput("");
    setLoading(true);
    setStreamText("");

    const apiMessages = [
      { role: "system", content: settings.systemPrompt },
      ...newMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const controller = new AbortController();
    abortRef.current = controller;
    let fullText = "";

    await streamChat(apiMessages, settings, {
      onToken: (token) => {
        fullText += token;
        setStreamText((prev) => prev + token);
      },
      onDone: (text) => {
        const finalText = text || fullText;
        const artifacts = extractArtifacts(finalText);
        const assistantMsg: Message = {
          id: uid(),
          role: "assistant",
          content: finalText,
          timestamp: Date.now(),
          artifacts: artifacts.length > 0 ? artifacts : undefined,
        };
        const finalConv: Conversation = {
          ...updated,
          messages: [...newMessages, assistantMsg],
          updatedAt: Date.now(),
        };
        onUpdate(finalConv);
        setLoading(false);
        setStreamText("");
        artifacts.forEach((a) => onArtifact(a));
      },
      onError: (err) => {
        const errMsg: Message = {
          id: uid(),
          role: "assistant",
          content: `Ошибка: ${err}`,
          timestamp: Date.now(),
        };
        onUpdate({
          ...updated,
          messages: [...newMessages, errMsg],
          updatedAt: Date.now(),
        });
        setLoading(false);
        setStreamText("");
      },
    }, controller.signal);
  };

  const stop = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const inputBar = (
    <div className="px-4 md:px-12 lg:px-20 py-4 bg-[#0a0a0a]">
      <div className="relative flex items-end gap-2 bg-[#141414] border border-[#222] rounded-2xl px-4 py-3 focus-within:border-[#444] transition-colors max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напишите сообщение..."
          rows={1}
          className="flex-1 bg-transparent text-sm text-[#e5e5e5] placeholder-[#555] resize-none focus:outline-none max-h-[180px] leading-relaxed"
        />
        {loading ? (
          <button onClick={stop} className="w-9 h-9 rounded-xl bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center text-red-400 transition-colors flex-shrink-0" title="Остановить">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          </button>
        ) : (
          <button
            onClick={() => send()}
            disabled={!input.trim()}
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              input.trim()
                ? "bg-[#F4EDE4] text-[#111] hover:bg-[#e8ddd0] scale-100"
                : "bg-[#1a1a1a] text-[#444] cursor-not-allowed scale-95"
            }`}
            title="Отправить"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9 22 2z"/></svg>
          </button>
        )}
      </div>
      <div className="text-[10px] text-[#333] text-center mt-2 select-none">
        Shift+Enter — новая строка · Enter — отправить
      </div>
    </div>
  );

  // Empty state — no conversation selected
  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6366f1]/20 to-[#a855f7]/20 flex items-center justify-center mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <div className="text-lg font-medium text-[#ccc] mb-1">Grouvi AI</div>
          <div className="text-sm text-[#555] mb-8">Выберите чат или создайте новый</div>
          <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => { onNewChat(); setTimeout(() => setInput(s.prompt), 100); }}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#111] border border-[#1e1e1e] hover:border-[#333] hover:bg-[#161616] transition-all text-left group"
              >
                <span className="text-lg">{s.icon}</span>
                <span className="text-xs text-[#888] group-hover:text-[#ccc] transition-colors">{s.text}</span>
              </button>
            ))}
          </div>
        </div>
        {inputBar}
      </div>
    );
  }

  const messages = Array.isArray(conversation.messages) ? conversation.messages : [];

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Header */}
      <div className="flex items-center px-5 h-12 border-b border-[#1a1a1a] bg-[#0a0a0a]/90 backdrop-blur-sm flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[#ccc] truncate">{conversation.title}</div>
          <div className="text-[10px] text-[#555] truncate">{conversation.model} · {messages.length} сообщ.</div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onOpenSettings} className="w-8 h-8 rounded-lg hover:bg-[#161616] flex items-center justify-center text-[#555] hover:text-[#aaa] transition-colors" title="Настройки">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          </button>
          <button
            onClick={onOpenDetail}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${detailOpen ? "bg-[#F4EDE4]/10 text-[#F4EDE4]" : "hover:bg-[#161616] text-[#555] hover:text-[#aaa]"}`}
            title="Панель"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/></svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-12 lg:px-20 py-6 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-[#444]">
              <div className="text-sm mb-6">Начните разговор или выберите подсказку</div>
              <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s.prompt)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[#111] border border-[#1a1a1a] hover:border-[#333] hover:bg-[#151515] transition-all text-left group"
                  >
                    <span className="text-base">{s.icon}</span>
                    <span className="text-xs text-[#666] group-hover:text-[#aaa] transition-colors">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role !== "user" && <AiAvatar />}
              <div className={`max-w-[80%] min-w-0 ${msg.role === "user" ? "" : ""}`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-[#F4EDE4] text-[#111] rounded-br-sm"
                      : "bg-[#131313] border border-[#1a1a1a] rounded-bl-sm"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="text-[13px] leading-relaxed prose-grouvi">
                      <Markdown text={msg.content} onArtifact={onArtifact} />
                    </div>
                  )}
                </div>
                <div className={`text-[10px] text-[#333] mt-1 px-1 ${msg.role === "user" ? "text-right" : ""}`}>
                  {new Date(msg.timestamp).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
              {msg.role === "user" && <UserAvatar />}
            </div>
          ))}

          {/* Streaming message */}
          {loading && (
            <div className="flex gap-3">
              <AiAvatar />
              <div className="max-w-[80%] min-w-0">
                <div className="bg-[#131313] border border-[#1a1a1a] rounded-2xl rounded-bl-sm px-4 py-3">
                  {streamText ? (
                    <div className="text-[13px] leading-relaxed prose-grouvi">
                      <Markdown text={streamText} onArtifact={onArtifact} />
                      <span className="inline-block w-0.5 h-4 bg-[#F4EDE4] ml-0.5 animate-pulse align-middle" />
                    </div>
                  ) : (
                    <div className="flex gap-1.5 py-1.5 px-1">
                      <div className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      {inputBar}
    </div>
  );
}
