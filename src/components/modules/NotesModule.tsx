import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";

/* ── Storage helpers ── */
const STORAGE_KEY = "grouvi_notes";

interface Note {
  id: string;
  title: string;
  body: string;
  created: number;
  updated: number;
  pinned: boolean;
  color: string;
}

const COLORS = [
  "",           // default (no tint)
  "#ef4444",    // red
  "#f59e0b",    // amber
  "#22c55e",    // green
  "#3b82f6",    // blue
  "#a855f7",    // purple
  "#ec4899",    // pink
];

function loadNotes(): Note[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "только что";
  if (diff < 3600000) return Math.floor(diff / 60000) + " мин";
  if (diff < 86400000) return Math.floor(diff / 3600000) + " ч";
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

type View = "list" | "edit";

export default function NotesModule() {
  const [notes, setNotes] = useState<Note[]>(() => loadNotes());
  const [view, setView] = useState<View>("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Persist on change ── */
  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  /* ── Active note ── */
  const active = useMemo(
    () => notes.find((n) => n.id === activeId) || null,
    [notes, activeId]
  );

  /* ── Filtered + sorted ── */
  const filtered = useMemo(() => {
    let list = notes;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updated - a.updated;
    });
  }, [notes, search]);

  /* ── Create note ── */
  const handleNew = useCallback(() => {
    const note: Note = {
      id: newId(),
      title: "",
      body: "",
      created: Date.now(),
      updated: Date.now(),
      pinned: false,
      color: "",
    };
    setNotes((prev) => [note, ...prev]);
    setActiveId(note.id);
    setView("edit");
    setTimeout(() => titleRef.current?.focus(), 50);
  }, []);

  /* ── Open note ── */
  const handleOpen = useCallback((id: string) => {
    setActiveId(id);
    setView("edit");
    setShowColorPicker(false);
  }, []);

  /* ── Update field with debounced save ── */
  const updateField = useCallback(
    (field: keyof Note, value: string | boolean) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === activeId
            ? { ...n, [field]: value, updated: Date.now() }
            : n
        )
      );
    },
    [activeId]
  );

  /* ── Delete note ── */
  const handleDelete = useCallback(() => {
    setNotes((prev) => prev.filter((n) => n.id !== activeId));
    setActiveId(null);
    setView("list");
  }, [activeId]);

  /* ── Toggle pin ── */
  const handlePin = useCallback(() => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === activeId
          ? { ...n, pinned: !n.pinned, updated: Date.now() }
          : n
      )
    );
  }, [activeId]);

  /* ── Duplicate ── */
  const handleDuplicate = useCallback(() => {
    if (!active) return;
    const dup: Note = {
      ...active,
      id: newId(),
      title: active.title + " (копия)",
      created: Date.now(),
      updated: Date.now(),
      pinned: false,
    };
    setNotes((prev) => [dup, ...prev]);
    setActiveId(dup.id);
  }, [active]);

  /* ── Export note as .txt ── */
  const handleExport = useCallback(() => {
    if (!active) return;
    const text = `${active.title}\n${"─".repeat(40)}\n${active.body}`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.title || "note"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [active]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    if (!active) return null;
    const words = active.body
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const chars = active.body.length;
    return { words, chars };
  }, [active]);

  /* ════════════════════════════════════════
     LIST VIEW
     ════════════════════════════════════════ */
  if (view === "list") {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-g-border flex items-center gap-2 shrink-0">
          <span className="ic-sm text-g-accent shrink-0">
            <svg viewBox="0 0 24 24">
              <path d="M12 20h9" />
              <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
            </svg>
          </span>
          <span className="text-[13px] text-g-text font-medium flex-1">Заметки</span>
          <span className="text-[11px] text-g-text3 font-mono">{notes.length}</span>
          <button onClick={handleNew} className="btn-icon" title="Новая заметка">
            <span className="ic-sm">
              <svg viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
          </button>
        </div>

        {/* Search */}
        {notes.length > 0 && (
          <div className="px-4 py-2 border-b border-g-border shrink-0">
            <div className="flex items-center gap-2 rounded-g border border-g-border2 px-2.5 py-1.5 focus-within:border-g-accent/40 transition-colors">
              <span className="ic-sm text-g-text3 shrink-0">
                <svg viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="flex-1 bg-transparent text-[12px] text-g-text placeholder:text-g-text3/40 outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="btn-icon">
                  <span className="ic-sm">
                    <svg viewBox="0 0 24 24">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Notes list */}
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-5 select-none">
              <div className="ic-lg text-g-text3/30 mb-3">
                <svg viewBox="0 0 24 24">
                  <path d="M12 20h9" />
                  <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
                </svg>
              </div>
              <div className="text-[13px] text-g-text3 mb-1">
                {notes.length === 0 ? "Нет заметок" : "Ничего не найдено"}
              </div>
              <div className="text-[11px] text-g-text3/60 text-center leading-relaxed mb-3">
                {notes.length === 0
                  ? "Создайте первую заметку.\nВсё хранится локально в браузере."
                  : "Попробуйте другой запрос"}
              </div>
              {notes.length === 0 && (
                <button onClick={handleNew} className="btn-primary flex items-center gap-2">
                  <span className="ic-sm">
                    <svg viewBox="0 0 24 24">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </span>
                  Создать заметку
                </button>
              )}
            </div>
          ) : (
            <ul>
              {filtered.map((note) => (
                <li
                  key={note.id}
                  onClick={() => handleOpen(note.id)}
                  className="flex items-start gap-3 px-4 py-3 border-b border-g-border cursor-pointer hover:bg-[rgba(255,255,255,.02)] active:bg-[rgba(255,255,255,.05)] transition-colors"
                >
                  {/* Color dot */}
                  {note.color && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                      style={{ backgroundColor: note.color }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {note.pinned && (
                        <span className="ic-sm text-g-accent shrink-0" style={{ width: 12, height: 12 }}>
                          <svg viewBox="0 0 24 24" style={{ width: 12, height: 12 }}>
                            <path d="M12 17v5" />
                            <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 1 1 0 0 0 1-1V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1a1 1 0 0 0 1 1 1 1 0 0 1 1 1z" />
                          </svg>
                        </span>
                      )}
                      <span className="text-[13px] text-g-text font-medium truncate">
                        {note.title || "Без заголовка"}
                      </span>
                    </div>
                    <div className="text-[11px] text-g-text3 truncate">
                      {note.body.slice(0, 80) || "Пустая заметка"}
                    </div>
                  </div>
                  <span className="text-[10px] text-g-text3 shrink-0 mt-0.5">
                    {fmtDate(note.updated)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     EDIT VIEW
     ════════════════════════════════════════ */
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-2 border-b border-g-border flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => {
            setView("list");
            setActiveId(null);
            setShowColorPicker(false);
          }}
          className="btn-icon"
          title="Назад"
        >
          <span className="ic-sm">
            <svg viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </span>
        </button>
        <div className="flex-1" />

        {/* Pin */}
        <button onClick={handlePin} className="btn-icon" title={active?.pinned ? "Открепить" : "Закрепить"}>
          <span className={`ic-sm ${active?.pinned ? "text-g-accent" : ""}`}>
            <svg viewBox="0 0 24 24">
              <path d="M12 17v5" />
              <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 1 1 0 0 0 1-1V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1a1 1 0 0 0 1 1 1 1 0 0 1 1 1z" />
            </svg>
          </span>
        </button>

        {/* Color */}
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="btn-icon"
            title="Цвет"
          >
            <span className="ic-sm">
              <svg viewBox="0 0 24 24">
                <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
                <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
                <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
                <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
              </svg>
            </span>
          </button>
          {showColorPicker && (
            <div className="absolute right-0 top-full mt-1 z-10 flex gap-1.5 p-2 rounded-g border border-g-border2 bg-g-panel2">
              {COLORS.map((c) => (
                <button
                  key={c || "none"}
                  onClick={() => {
                    updateField("color", c);
                    setShowColorPicker(false);
                  }}
                  className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                    active?.color === c
                      ? "border-g-text scale-110"
                      : "border-g-border2"
                  }`}
                  style={{
                    backgroundColor: c || "transparent",
                    ...(c === "" ? { border: "2px dashed var(--color-g-text3, #666)" } : {}),
                  }}
                  title={c === "" ? "Без цвета" : c}
                />
              ))}
            </div>
          )}
        </div>

        {/* Duplicate */}
        <button onClick={handleDuplicate} className="btn-icon" title="Дублировать">
          <span className="ic-sm">
            <svg viewBox="0 0 24 24">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </span>
        </button>

        {/* Export */}
        <button onClick={handleExport} className="btn-icon" title="Скачать .txt">
          <span className="ic-sm">
            <svg viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </span>
        </button>

        {/* Delete */}
        <button onClick={handleDelete} className="btn-icon" title="Удалить">
          <span className="ic-sm text-red-400/70 hover:text-red-400">
            <svg viewBox="0 0 24 24">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </span>
        </button>
      </div>

      {/* Title */}
      <div className="px-4 pt-3 pb-1 shrink-0">
        <input
          ref={titleRef}
          type="text"
          value={active?.title || ""}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="Заголовок"
          className="w-full bg-transparent text-[16px] text-g-text font-semibold placeholder:text-g-text3/30 outline-none"
        />
      </div>

      {/* Body */}
      <div className="flex-1 px-4 pb-2 overflow-hidden">
        <textarea
          ref={bodyRef}
          value={active?.body || ""}
          onChange={(e) => updateField("body", e.target.value)}
          placeholder="Начните писать..."
          className="w-full h-full bg-transparent text-[13px] text-g-text2 leading-relaxed placeholder:text-g-text3/30 outline-none resize-none"
        />
      </div>

      {/* Footer stats */}
      <div className="px-4 py-1.5 border-t border-g-border flex items-center justify-between shrink-0">
        <span className="text-[10px] text-g-text3/60">
          {stats ? `${stats.words} слов · ${stats.chars} символов` : ""}
        </span>
        <span className="text-[10px] text-g-text3/60">
          {active ? fmtDate(active.updated) : ""}
        </span>
      </div>
    </div>
  );
}
