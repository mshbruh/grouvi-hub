// ── Grouvi AI Sidebar ──
import React, { useState, useRef } from "react";
import type { Conversation } from "./types";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин. назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч. назад`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} дн. назад`;
  return new Date(ts).toLocaleDateString("ru", { day: "numeric", month: "short" });
}

export function Sidebar({ conversations, activeId, onSelect, onNew, onDelete, onRename, collapsed, onToggle }: Props) {
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  const list = Array.isArray(conversations) ? conversations : [];
  const sorted = [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  const filtered = search
    ? sorted.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : sorted;

  const startRename = (c: Conversation) => {
    setEditId(c.id);
    setEditVal(c.title);
    setTimeout(() => editRef.current?.focus(), 50);
  };

  const finishRename = () => {
    if (editId && editVal.trim()) onRename(editId, editVal);
    setEditId(null);
  };

  if (collapsed) {
    return (
      <div className="w-12 h-full bg-[#0a0a0a] border-r border-[#151515] flex flex-col items-center py-3 gap-3 flex-shrink-0">
        <button onClick={onToggle} className="w-8 h-8 rounded-lg hover:bg-[#161616] flex items-center justify-center text-[#555] hover:text-[#aaa] transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <button onClick={onNew} className="w-8 h-8 rounded-lg hover:bg-[#161616] flex items-center justify-center text-[#555] hover:text-[#aaa] transition-colors" title="Новый чат">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-[260px] h-full bg-[#0a0a0a] border-r border-[#151515] flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-12 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onToggle} className="w-8 h-8 rounded-lg hover:bg-[#161616] flex items-center justify-center text-[#555] hover:text-[#aaa] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <span className="text-xs font-semibold text-[#666] tracking-widest uppercase">Grouvi AI</span>
        </div>
        <button onClick={onNew} className="w-8 h-8 rounded-lg hover:bg-[#161616] flex items-center justify-center text-[#555] hover:text-[#aaa] transition-colors" title="Новый чат">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2 flex-shrink-0">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#444]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#111] border border-[#1a1a1a] text-xs text-[#ccc] placeholder-[#444] focus:outline-none focus:border-[#333] transition-colors"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-thin">
        {filtered.length === 0 && (
          <div className="text-xs text-[#444] text-center py-8">
            {search ? "Ничего не найдено" : "Нет чатов — начните новый!"}
          </div>
        )}
        {filtered.map((c) => {
          const isActive = c.id === activeId;
          const isEditing = editId === c.id;

          return (
            <div
              key={c.id}
              onClick={() => !isEditing && onSelect(c.id)}
              className={`group rounded-lg px-3 py-2 mb-0.5 cursor-pointer transition-colors ${
                isActive ? "bg-[#161616]" : "hover:bg-[#111]"
              }`}
            >
              {isEditing ? (
                <input
                  ref={editRef}
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  onBlur={finishRename}
                  onKeyDown={(e) => { if (e.key === "Enter") finishRename(); if (e.key === "Escape") setEditId(null); }}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-2 py-0.5 text-xs text-[#ccc] focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-1">
                    <div className="text-xs text-[#ccc] truncate leading-snug flex-1">{c.title}</div>
                    <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); startRename(c); }}
                        className="w-5 h-5 rounded flex items-center justify-center text-[#555] hover:text-[#aaa] hover:bg-[#222] transition-colors"
                        title="Переименовать"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (confirm("Удалить чат?")) onDelete(c.id); }}
                        className="w-5 h-5 rounded flex items-center justify-center text-[#555] hover:text-red-400 hover:bg-[#222] transition-colors"
                        title="Удалить"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#444] mt-0.5">
                    {c.messages.length} сообщ. · {timeAgo(c.updatedAt)}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
