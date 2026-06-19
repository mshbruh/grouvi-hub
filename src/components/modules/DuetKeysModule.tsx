import React, { useState, useCallback, useEffect, useRef } from "react";

/* ── Types ── */
interface DuetKey {
  id: string;
  label: string;
  apiKey: string;
  channelId: string;
  isActive: boolean;
  balance: number | null;
  monthlyUsage: number | null;
  totalUsed: number | null;
  orgName: string | null;
  lastStatus: string | null;
  _checking?: boolean;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  meta?: string;
}

type View = "keys" | "chat" | "add" | "edit";

const API = "/duet-api";

export default function DuetKeysModule() {
  const [view, setView] = useState<View>("keys");
  const [keys, setKeys] = useState<DuetKey[]>([]);
  const [loading, setLoading] = useState(false);

  // Add/Edit form
  const [editId, setEditId] = useState<string | null>(null);
  const [formLabel, setFormLabel] = useState("");
  const [formApiKey, setFormApiKey] = useState("");
  const [formChannelId, setFormChannelId] = useState("");

  // Chat
  const [chatKeyId, setChatKeyId] = useState("");
  const [chatAutoSwitch, setChatAutoSwitch] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const loadKeys = useCallback(async () => {
    try {
      const r = await fetch(`${API}/keys`);
      const data = await r.json();
      setKeys(data);
      if (!chatKeyId && data.length > 0) {
        const active = data.find((k: DuetKey) => k.isActive);
        setChatKeyId((active || data[0]).id);
      }
    } catch (e) {
      console.error("Failed to load keys:", e);
    }
  }, [chatKeyId]);

  useEffect(() => { loadKeys(); }, []);

  const checkKey = useCallback(async (id: string) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, _checking: true } : k));
    try {
      await fetch(`${API}/keys/${id}/check`, { method: "POST" });
      await loadKeys();
    } catch (e) { console.error(e); }
    setKeys(prev => prev.map(k => k.id === id ? { ...k, _checking: false } : k));
  }, [loadKeys]);

  const activateKey = useCallback(async (id: string) => {
    await fetch(`${API}/keys/${id}/activate`, { method: "POST" });
    await loadKeys();
  }, [loadKeys]);

  const deleteKey = useCallback(async (id: string, label: string) => {
    if (!confirm(`Удалить ключ "${label}"?`)) return;
    await fetch(`${API}/keys/${id}`, { method: "DELETE" });
    await loadKeys();
  }, [loadKeys]);

  const openAdd = () => {
    setEditId(null);
    setFormLabel("");
    setFormApiKey("");
    setFormChannelId("");
    setView("add");
  };

  const openEdit = (key: DuetKey) => {
    setEditId(key.id);
    setFormLabel(key.label);
    setFormApiKey("");
    setFormChannelId(key.channelId || "");
    setView("edit");
  };

  const saveKey = useCallback(async () => {
    if (!formLabel) return;
    if (editId) {
      const body: Record<string, string> = { label: formLabel, channelId: formChannelId };
      if (formApiKey) body.apiKey = formApiKey;
      await fetch(`${API}/keys/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      if (!formApiKey) return;
      await fetch(`${API}/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: formLabel, apiKey: formApiKey, channelId: formChannelId }),
      });
    }
    await loadKeys();
    setView("keys");
  }, [editId, formLabel, formApiKey, formChannelId, loadKeys]);

  const sendChat = useCallback(async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatMessages(prev => [...prev, { role: "user", content: msg }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const r = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId: chatKeyId, message: msg, autoSwitch: chatAutoSwitch }),
      });
      const data = await r.json();
      if (data.error) {
        setChatMessages(prev => [...prev, { role: "assistant", content: "❌ " + data.error }]);
      } else {
        setChatMessages(prev => [...prev, {
          role: "assistant",
          content: data.response,
          meta: `${data.model} · ключ: ${data.keyUsed}`,
        }]);
      }
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: "assistant", content: "❌ " + e.message }]);
    }
    setChatLoading(false);
  }, [chatInput, chatKeyId, chatAutoSwitch, chatLoading]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatMessages, chatLoading]);

  const totalBalance = keys.reduce((a, k) => a + (k.balance || 0), 0);
  const totalMonthly = keys.reduce((a, k) => a + (k.monthlyUsage || 0), 0);

  /* ── Render ── */
  return (
    <div className="h-full flex flex-col text-[13px]">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-g-border2 shrink-0">
        <button
          onClick={() => setView("keys")}
          className={`px-3 py-1 rounded-md text-[12px] font-medium transition ${
            view === "keys" || view === "add" || view === "edit"
              ? "bg-g-accent/20 text-g-accent"
              : "text-g-text3 hover:text-g-text"
          }`}
        >
          🔑 Ключи
        </button>
        <button
          onClick={() => setView("chat")}
          className={`px-3 py-1 rounded-md text-[12px] font-medium transition ${
            view === "chat"
              ? "bg-g-accent/20 text-g-accent"
              : "text-g-text3 hover:text-g-text"
          }`}
        >
          💬 Чат
        </button>
        {(view === "keys") && (
          <button onClick={openAdd} className="ml-auto px-2 py-1 rounded-md text-[11px] bg-g-accent/20 text-g-accent hover:bg-g-accent/30 transition">
            + Добавить
          </button>
        )}
      </div>

      {/* ── Keys view ── */}
      {view === "keys" && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="bg-g-panel2 rounded-lg p-2 text-center">
              <div className="text-[10px] text-g-text3 uppercase">Баланс</div>
              <div className="text-sm font-bold text-green-400">
                {totalBalance > 0 ? `$${totalBalance.toFixed(2)}` : "—"}
              </div>
            </div>
            <div className="bg-g-panel2 rounded-lg p-2 text-center">
              <div className="text-[10px] text-g-text3 uppercase">Месяц</div>
              <div className="text-sm font-bold text-yellow-400">
                {totalMonthly > 0 ? `$${totalMonthly.toFixed(2)}` : "—"}
              </div>
            </div>
            <div className="bg-g-panel2 rounded-lg p-2 text-center">
              <div className="text-[10px] text-g-text3 uppercase">Ключей</div>
              <div className="text-sm font-bold text-g-text">{keys.length}</div>
            </div>
          </div>

          {/* Key cards */}
          {keys.map(key => (
            <div key={key.id} className="bg-g-panel2 rounded-lg p-3 border border-g-border2">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${key.isActive ? "bg-green-400 animate-pulse" : "bg-g-text3/30"}`} />
                <span className="font-medium text-g-text">{key.label}</span>
                {key.isActive && (
                  <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">ACTIVE</span>
                )}
                {key.balance !== null && (
                  <span className="ml-auto text-[12px] font-mono text-green-400">${Number(key.balance).toFixed(2)}</span>
                )}
              </div>
              <div className="text-[11px] text-g-text3 font-mono mb-1">{key.apiKey}</div>
              {key.monthlyUsage !== null && (
                <div className="text-[10px] text-g-text3 mb-2">
                  Месяц: ${Number(key.monthlyUsage || 0).toFixed(2)} · Всего: ${Number(key.totalUsed || 0).toFixed(2)}
                </div>
              )}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => checkKey(key.id)}
                  disabled={key._checking}
                  className="px-2 py-1 rounded text-[11px] bg-g-bg2 hover:bg-g-border2 text-g-text2 transition disabled:opacity-40"
                >
                  {key._checking ? "⏳" : "🔄"} Проверить
                </button>
                {!key.isActive && (
                  <button
                    onClick={() => activateKey(key.id)}
                    className="px-2 py-1 rounded text-[11px] bg-g-bg2 hover:bg-g-border2 text-g-text2 transition"
                  >
                    ⚡ Активировать
                  </button>
                )}
                <button
                  onClick={() => openEdit(key)}
                  className="px-2 py-1 rounded text-[11px] bg-g-bg2 hover:bg-g-border2 text-g-text2 transition"
                >
                  ✏️
                </button>
                <button
                  onClick={() => deleteKey(key.id, key.label)}
                  className="px-2 py-1 rounded text-[11px] bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}

          {keys.length === 0 && (
            <div className="text-center text-g-text3 py-8 text-[12px]">
              Нет ключей. Нажми «+ Добавить» чтобы начать.
            </div>
          )}
        </div>
      )}

      {/* ── Add/Edit view ── */}
      {(view === "add" || view === "edit") && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <h3 className="text-sm font-semibold text-g-text">
            {editId ? "Изменить ключ" : "Добавить ключ"}
          </h3>
          <div>
            <label className="text-[11px] text-g-text3 mb-1 block">Метка</label>
            <input
              value={formLabel}
              onChange={e => setFormLabel(e.target.value)}
              placeholder="Main, Backup..."
              className="w-full bg-g-bg2 border border-g-border2 rounded-md px-3 py-1.5 text-[12px] text-g-text placeholder-g-text3/50 focus:outline-none focus:border-g-accent"
            />
          </div>
          <div>
            <label className="text-[11px] text-g-text3 mb-1 block">API Key</label>
            <input
              value={formApiKey}
              onChange={e => setFormApiKey(e.target.value)}
              placeholder={editId ? "оставь пустым чтобы не менять" : "duet_gt_..."}
              className="w-full bg-g-bg2 border border-g-border2 rounded-md px-3 py-1.5 text-[12px] text-g-text font-mono placeholder-g-text3/50 focus:outline-none focus:border-g-accent"
            />
          </div>
          <div>
            <label className="text-[11px] text-g-text3 mb-1 block">Channel ID (для чата)</label>
            <input
              value={formChannelId}
              onChange={e => setFormChannelId(e.target.value)}
              placeholder="j9759kdm..."
              className="w-full bg-g-bg2 border border-g-border2 rounded-md px-3 py-1.5 text-[12px] text-g-text font-mono placeholder-g-text3/50 focus:outline-none focus:border-g-accent"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setView("keys")}
              className="px-3 py-1.5 rounded-md text-[12px] text-g-text3 hover:text-g-text transition"
            >
              Отмена
            </button>
            <button
              onClick={saveKey}
              className="px-4 py-1.5 rounded-md text-[12px] bg-g-accent text-white hover:bg-g-accent/90 transition font-medium"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}

      {/* ── Chat view ── */}
      {view === "chat" && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-g-border2 shrink-0">
            <select
              value={chatKeyId}
              onChange={e => setChatKeyId(e.target.value)}
              className="bg-g-bg2 border border-g-border2 text-[11px] rounded-md px-2 py-1 text-g-text"
            >
              {keys.map(k => (
                <option key={k.id} value={k.id}>{k.label}{k.isActive ? " ★" : ""}</option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-[10px] text-g-text3">
              <input type="checkbox" checked={chatAutoSwitch} onChange={e => setChatAutoSwitch(e.target.checked)} className="rounded" />
              авто-свич
            </label>
            <button
              onClick={() => setChatMessages([])}
              className="ml-auto text-[10px] text-g-text3 hover:text-g-text transition"
            >
              очистить
            </button>
          </div>

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-[12px] ${
                  msg.role === "user"
                    ? "bg-g-accent text-white"
                    : "bg-g-panel2 text-g-text border border-g-border2"
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {msg.meta && (
                    <div className="mt-1 text-[9px] opacity-50">{msg.meta}</div>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-g-panel2 rounded-xl px-3 py-2 border border-g-border2">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-g-accent rounded-full animate-pulse" />
                    <span className="w-1.5 h-1.5 bg-g-accent rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <span className="w-1.5 h-1.5 bg-g-accent rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                  </span>
                </div>
              </div>
            )}
            {chatMessages.length === 0 && !chatLoading && (
              <div className="text-center text-g-text3/50 py-8 text-[11px]">
                Выбери ключ и начни чат
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-g-border2 p-2 shrink-0">
            <form onSubmit={e => { e.preventDefault(); sendChat(); }} className="flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Сообщение..."
                disabled={chatLoading}
                className="flex-1 bg-g-bg2 border border-g-border2 rounded-lg px-3 py-1.5 text-[12px] text-g-text placeholder-g-text3/50 focus:outline-none focus:border-g-accent transition disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="bg-g-accent hover:bg-g-accent/90 disabled:opacity-30 text-white px-3 py-1.5 rounded-lg text-[12px] font-medium transition"
              >
                ➤
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
