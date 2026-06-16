"use client";

import React from "react";

interface WindowProps {
  title: string;
  badge?: string;
  onClose: () => void;
  closing?: boolean;
  children: React.ReactNode;
}

export default function Window({
  title,
  badge,
  onClose,
  closing,
  children,
}: WindowProps) {
  return (
    <div
      className={`h-full flex flex-col bg-g-panel border border-g-border rounded-g2 overflow-hidden shadow-lg shadow-black/20 ${
        closing ? "window-close" : "window-appear"
      }`}
    >
      {/* Title bar */}
      <div className="window-drag-handle flex items-center justify-between px-3.5 py-2 border-b border-g-border bg-g-panel2/50 cursor-grab active:cursor-grabbing select-none shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Traffic lights */}
          <div className="flex gap-1.5">
            <button
              onClick={onClose}
              className="w-[11px] h-[11px] rounded-full bg-[#ff5f57] hover:bg-[#ff3b30] transition-colors"
              title="Закрыть"
            />
            <span className="w-[11px] h-[11px] rounded-full bg-[#febc2e] opacity-60" />
            <span className="w-[11px] h-[11px] rounded-full bg-[#28c840] opacity-60" />
          </div>
          <span className="font-mono text-[11px] text-g-text3 tracking-wide">
            {title}
          </span>
        </div>
        {badge && (
          <span
            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
              badge === "active"
                ? "text-g-green border-g-green/30 bg-g-green/10"
                : badge === "setup"
                ? "text-g-code border-g-code/30 bg-g-code/10"
                : "text-g-text3 border-g-border2 bg-white/[.03]"
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
