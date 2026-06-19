// ── Grouvi AI Settings Modal ──
import React, { useState, useEffect } from "react";
import type { AppSettings, ModelInfo } from "./types";

interface Props {
  settings: AppSettings;
  models: ModelInfo[];
  open: boolean;
  onClose: () => void;
  onSave: (s: AppSettings) => void;
}

export function Settings({ settings, models, open, onClose, onSave }: Props) {
  const [local, setLocal] = useState<AppSettings>({ ...settings });

  useEffect(() => {
    if (open) setLocal({ ...settings });
  }, [open, settings]);

  if (!open) return null;

  const safeModels = Array.isArray(models) ? models : [];

  const update = <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => {
    setLocal((prev) => ({ ...prev, [key]: val }));
  };

  const save = () => {
    onSave(local);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-[#111] border border-[#222] rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
          <div className="text-sm font-medium text-[#ccc]">Настройки</div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-[#1a1a1a] flex items-center justify-center text-[#555] hover:text-[#aaa] transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* API Key */}
          <div>
            <label className="text-xs text-[#888] mb-1 block">API Key</label>
            <input
              type="password"
              value={local.apiKey}
              onChange={(e) => update("apiKey", e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#222] text-sm text-[#ccc] placeholder-[#444] focus:outline-none focus:border-[#444] transition-colors font-mono"
            />
          </div>

          {/* API URL */}
          <div>
            <label className="text-xs text-[#888] mb-1 block">API URL</label>
            <input
              type="text"
              value={local.apiUrl}
              onChange={(e) => update("apiUrl", e.target.value)}
              placeholder="https://ai.grouvi.online"
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#222] text-sm text-[#ccc] placeholder-[#444] focus:outline-none focus:border-[#444] transition-colors font-mono"
            />
          </div>

          {/* Model */}
          <div>
            <label className="text-xs text-[#888] mb-1 block">Модель</label>
            {safeModels.length > 0 ? (
              <select
                value={local.model}
                onChange={(e) => update("model", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#222] text-sm text-[#ccc] focus:outline-none focus:border-[#444] transition-colors"
              >
                {safeModels.map((m) => (
                  <option key={m.id} value={m.id}>{m.id}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={local.model}
                onChange={(e) => update("model", e.target.value)}
                placeholder="llm7/gpt-4.1-nano"
                className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#222] text-sm text-[#ccc] placeholder-[#444] focus:outline-none focus:border-[#444] transition-colors font-mono"
              />
            )}
          </div>

          {/* Temperature */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#888]">Температура</label>
              <span className="text-xs text-[#666] font-mono">{local.temperature.toFixed(1)}</span>
            </div>
            <input
              type="range" min="0" max="2" step="0.1"
              value={local.temperature}
              onChange={(e) => update("temperature", parseFloat(e.target.value))}
              className="w-full accent-[#F4EDE4]"
            />
          </div>

          {/* Max tokens */}
          <div>
            <label className="text-xs text-[#888] mb-1 block">Макс. токенов</label>
            <input
              type="number" min="256" max="128000" step="256"
              value={local.maxTokens}
              onChange={(e) => update("maxTokens", parseInt(e.target.value) || 4096)}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#222] text-sm text-[#ccc] focus:outline-none focus:border-[#444] transition-colors font-mono"
            />
          </div>

          {/* Stream toggle */}
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#888]">Стриминг</label>
            <button
              onClick={() => update("streamEnabled", !local.streamEnabled)}
              className={`w-10 h-5 rounded-full transition-colors ${local.streamEnabled ? "bg-[#F4EDE4]" : "bg-[#333]"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-[#111] shadow transition-transform ${local.streamEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>

          {/* System prompt */}
          <div>
            <label className="text-xs text-[#888] mb-1 block">Системный промпт</label>
            <textarea
              value={local.systemPrompt}
              onChange={(e) => update("systemPrompt", e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#222] text-sm text-[#ccc] placeholder-[#444] resize-none focus:outline-none focus:border-[#444] transition-colors leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#1a1a1a]">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs text-[#888] hover:text-[#ccc] hover:bg-[#1a1a1a] transition-colors">
            Отмена
          </button>
          <button onClick={save} className="px-4 py-2 rounded-lg text-xs font-medium bg-[#F4EDE4] text-[#111] hover:bg-[#e8ddd0] transition-colors">
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
