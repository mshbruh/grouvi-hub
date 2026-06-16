"use client";

import React from "react";
import { MODULE_REGISTRY, ModuleDef } from "@/lib/window-registry";

interface ModuleSelectorProps {
  onSelect: (mod: ModuleDef) => void;
  usedModules: string[];
}

// SVG icons for modules (no emojis)
const MODULE_ICONS: Record<string, React.ReactNode> = {
  mail: (
    <svg viewBox="0 0 24 24">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
};

export default function ModuleSelector({ onSelect, usedModules }: ModuleSelectorProps) {
  return (
    <div className="p-5 h-full flex flex-col items-center justify-center">
      <div className="ic-lg text-g-text3 mb-4">
        <svg viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      </div>
      <div className="text-sm text-g-text2 font-medium mb-1">Выберите модуль</div>
      <div className="text-[11px] text-g-text3 mb-6">для этого окна</div>

      <div className="w-full max-w-[320px] space-y-2">
        {MODULE_REGISTRY.map((mod) => {
          const used = usedModules.includes(mod.id);
          return (
            <button
              key={mod.id}
              onClick={() => !used && onSelect(mod)}
              disabled={used}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-g border transition-all duration-150 ${
                used
                  ? "border-g-border/50 opacity-40 cursor-not-allowed"
                  : "border-g-border hover:bg-[rgba(255,255,255,.04)] hover:border-g-border2 cursor-pointer active:bg-[rgba(255,255,255,.08)]"
              }`}
            >
              <span className="ic text-g-text3 shrink-0">
                {MODULE_ICONS[mod.id] || (
                  <svg viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-g-text font-medium">
                  {mod.title}
                </div>
                <div className="text-[11px] text-g-text3">
                  {mod.description}
                </div>
              </div>
              {!used && (
                <span className="ic-sm text-g-text3 shrink-0">
                  <svg viewBox="0 0 24 24">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
