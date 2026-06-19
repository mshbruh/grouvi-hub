import React, { useState, useRef, useEffect } from "react";

interface TopBarProps {
  onAddWindow: () => void;
  windowCount: number;
}

const SERVICES = [
  { label: "AI Office", emoji: "🏢", url: "https://ai.grouvi.online", desc: "AI-команда" },
  { label: "OmniRoute", emoji: "🧠", url: "https://omniroute.grouvi.online", desc: "LLM маршрутизация" },
  { label: "Temp Mail", emoji: "📧", url: "https://temp.grouvi.online", desc: "Временная почта" },
  { label: "Cards", emoji: "💳", url: "https://cards.grouvi.online", desc: "Генератор карт" },
  { label: "Notes", emoji: "📝", url: "https://notes.grouvi.online", desc: "Заметки" },
  { label: "Grafana", emoji: "📊", url: "https://grafana.freelance-gid.online", desc: "Мониторинг" },
  { label: "AccessBot", emoji: "🤖", url: "https://app.freelance-gid.online", desc: "Telegram бот" },
];

export default function TopBar({ onAddWindow, windowCount }: TopBarProps) {
  const [servicesOpen, setServicesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 h-11 bg-g-bg/80 backdrop-blur-xl border-b border-g-border"
      data-tauri-drag-region
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2 text-sm font-semibold text-g-accent tracking-tight">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          Grouvi Hub
        </span>

        {/* Services dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setServicesOpen(!servicesOpen)}
            className={`flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-md border transition-all ${
              servicesOpen
                ? "border-g-accent/40 text-g-accent bg-g-accent/5"
                : "text-g-text2 border-g-border2 hover:border-g-accent/30 hover:text-g-text"
            }`}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Сервисы
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`transition-transform ${servicesOpen ? "rotate-180" : ""}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {servicesOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-g-bg2 border border-g-border rounded-xl shadow-2xl shadow-black/40 py-2 z-50 animate-scale-in">
              <div className="px-3 py-1.5 text-[10px] font-semibold text-g-text3 uppercase tracking-wider">
                Наши сервисы
              </div>
              {SERVICES.map((svc) => (
                <a
                  key={svc.url}
                  href={svc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 hover:bg-white/[.04] transition-colors group"
                  onClick={() => setServicesOpen(false)}
                >
                  <span className="text-lg w-8 h-8 flex items-center justify-center rounded-lg bg-white/[.04] group-hover:bg-white/[.08] transition-colors shrink-0">
                    {svc.emoji}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-g-text group-hover:text-g-accent transition-colors">
                      {svc.label}
                    </div>
                    <div className="text-[10px] text-g-text3 truncate">{svc.desc}</div>
                  </div>
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-g-text3 group-hover:text-g-accent ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <path d="M7 17L17 7M17 7H7M17 7v10" />
                  </svg>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {windowCount > 0 && (
          <span className="text-[11px] font-mono text-g-text3">
            {windowCount}{" "}
            {windowCount === 1
              ? "окно"
              : windowCount < 5
              ? "окна"
              : "окон"}
          </span>
        )}
        <button
          onClick={onAddWindow}
          className="flex items-center gap-1.5 text-[12px] font-medium text-g-text2 px-3 py-1.5 rounded-md border border-g-border2 hover:border-g-accent/30 hover:text-g-text hover:bg-white/[.03] transition-all"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Окно
        </button>

        <div className="w-px h-5 bg-g-border mx-1" />

        <span className="flex items-center gap-1.5 text-[11px] font-mono text-g-green">
          <span className="w-1.5 h-1.5 rounded-full bg-g-green animate-pulse" />
          online
        </span>
      </div>
    </nav>
  );
}
