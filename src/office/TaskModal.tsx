import React, { useState, useRef, useEffect } from "react";
import { submitTeamTask } from "./api";

interface TaskModalProps {
  onClose: () => void;
  onSubmit: () => void;
}

export default function TaskModal({ onClose, onSubmit }: TaskModalProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await submitTeamTask(text.trim());
      onSubmit();
    } catch (err: any) {
      alert("Ошибка: " + err.message);
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-g-bg2 rounded-2xl border border-g-border w-full max-w-lg mx-4 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-g-border">
          <div>
            <h2 className="text-base font-semibold text-g-text">Новая задача для команды</h2>
            <p className="text-xs text-g-text3 mt-0.5">Mike (Team Lead) проанализирует и делегирует подзадачи</p>
          </div>
          <button onClick={onClose} className="text-g-text3 hover:text-g-text transition-colors p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Опишите задачу для команды...\n\nПримеры:\n• Исследуй конкурентов AccessBot и составь отчёт\n• Спроектируй архитектуру микросервиса авторизации\n• Проверь все эндпоинты API на сервере"
            rows={6}
            className="w-full bg-g-bg rounded-xl border border-g-border2 px-4 py-3 text-sm text-g-text placeholder:text-g-text3/50 focus:outline-none focus:border-g-accent/40 resize-none"
          />

          {/* Team preview */}
          <div className="mt-4 flex items-center gap-1.5">
            <span className="text-[11px] text-g-text3 mr-1">Команда:</span>
            {["👨‍💼", "📋", "🏗️", "⚙️", "🔍", "🧪"].map((e, i) => (
              <span key={i} className="w-7 h-7 rounded-full bg-g-bg flex items-center justify-center text-sm border border-g-border2">
                {e}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-g-border bg-g-bg2/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-g-text3 hover:text-g-text rounded-lg transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || submitting}
            className="px-5 py-2 text-xs font-medium bg-g-accent text-g-bg rounded-lg hover:bg-g-accent/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
          >
            {submitting ? (
              <>
                <div className="w-3 h-3 border border-g-bg border-t-transparent rounded-full animate-spin" />
                Отправка...
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Отправить команде
                <span className="text-[10px] opacity-60 ml-1">⌘↵</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
