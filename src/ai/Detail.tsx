// ── Grouvi AI Detail Panel (Artifacts + Model info) ──
import React, { useState } from "react";
import type { Artifact, AppSettings, ModelInfo } from "./types";

interface Props {
  artifacts: Artifact[];
  settings: AppSettings;
  models: ModelInfo[];
  open: boolean;
  onClose: () => void;
  onClearArtifacts: () => void;
}

function ArtifactPreview({ art }: { art: Artifact }) {
  const [expanded, setExpanded] = useState(false);
  const langColors: Record<string, string> = {
    python: "#3572A5", javascript: "#f7df1e", typescript: "#3178c6",
    html: "#e34c26", css: "#563d7c", json: "#292929", bash: "#89e051",
    sql: "#e38c00", rust: "#dea584", go: "#00ADD8",
  };
  const color = langColors[art.language || ""] || "#666";

  return (
    <div className="border border-[#1a1a1a] rounded-lg overflow-hidden bg-[#0e0e0e] hover:border-[#222] transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-xs text-[#ccc] truncate flex-1">{art.title}</span>
        {art.language && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1a] text-[#888] flex-shrink-0">{art.language}</span>
        )}
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"
          className={`flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {expanded && (
        <div className="border-t border-[#1a1a1a]">
          <pre className="p-3 text-[11px] text-[#aaa] overflow-x-auto max-h-[300px] scrollbar-thin font-mono leading-relaxed">
            {art.content}
          </pre>
          <div className="flex gap-1 px-3 py-2 border-t border-[#1a1a1a]">
            <button
              onClick={() => navigator.clipboard.writeText(art.content)}
              className="text-[10px] text-[#666] hover:text-[#aaa] px-2 py-1 rounded hover:bg-[#161616] transition-colors"
            >
              Копировать
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Detail({ artifacts, settings, models, open, onClose, onClearArtifacts }: Props) {
  const [tab, setTab] = useState<"artifacts" | "model">("artifacts");

  if (!open) return null;

  const safeArtifacts = Array.isArray(artifacts) ? artifacts : [];
  const safeModels = Array.isArray(models) ? models : [];

  return (
    <div className="w-[300px] h-full bg-[#0a0a0a] border-l border-[#151515] flex flex-col flex-shrink-0">
      {/* Tabs */}
      <div className="flex items-center h-12 px-3 border-b border-[#151515] flex-shrink-0">
        <div className="flex gap-1 flex-1">
          <button
            onClick={() => setTab("artifacts")}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              tab === "artifacts" ? "bg-[#F4EDE4] text-[#111] font-medium" : "text-[#666] hover:text-[#aaa] hover:bg-[#111]"
            }`}
          >
            Артефакты{safeArtifacts.length > 0 && ` (${safeArtifacts.length})`}
          </button>
          <button
            onClick={() => setTab("model")}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              tab === "model" ? "bg-[#F4EDE4] text-[#111] font-medium" : "text-[#666] hover:text-[#aaa] hover:bg-[#111]"
            }`}
          >
            Модель
          </button>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-[#161616] flex items-center justify-center text-[#555] hover:text-[#aaa] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {tab === "artifacts" && (
          <>
            {safeArtifacts.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-[#555]">{safeArtifacts.length} артефакт(ов)</span>
                  <button onClick={onClearArtifacts} className="text-[10px] text-[#555] hover:text-[#aaa] transition-colors">
                    Очистить
                  </button>
                </div>
                <div className="space-y-2">
                  {[...safeArtifacts].reverse().map((art) => (
                    <ArtifactPreview key={art.id} art={art} />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-[#444]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 text-[#333]">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                </svg>
                <div className="text-xs text-[#555] mb-1">Артефакты появятся здесь</div>
                <div className="text-[10px] text-[#333]">Код и результаты из чата</div>
              </div>
            )}
          </>
        )}

        {tab === "model" && (
          <div className="space-y-3">
            <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-3">
              <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Текущая модель</div>
              <div className="text-sm text-[#ccc] font-mono">{settings.model}</div>
            </div>
            <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-3">
              <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Температура</div>
              <div className="text-sm text-[#ccc]">{settings.temperature}</div>
            </div>
            <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-3">
              <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Макс. токенов</div>
              <div className="text-sm text-[#ccc]">{settings.maxTokens}</div>
            </div>
            <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-3">
              <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">Стриминг</div>
              <div className="text-sm text-[#ccc]">{settings.streamEnabled ? "Включен" : "Выключен"}</div>
            </div>
            {safeModels.length > 0 && (
              <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-3">
                <div className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Доступные модели ({safeModels.length})</div>
                <div className="space-y-1 max-h-[300px] overflow-y-auto scrollbar-thin">
                  {safeModels.map((m) => (
                    <div key={m.id} className="text-[11px] text-[#888] font-mono truncate py-0.5">{m.id}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
