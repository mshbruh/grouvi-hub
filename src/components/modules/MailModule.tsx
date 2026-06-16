

import React, { useState, useCallback, useEffect, useRef } from "react";

const WORKER = "https://temp-email.mishamavashikz.workers.dev";

interface MailAddress {
  address: string;
  jwt: string;
  created: number;
}

interface MailMessage {
  id: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  created_at: string;
  source?: string;
}

type View = "setup" | "inbox" | "reading";

/* ── helper: decode JWT payload ── */
function jwtDecode(jwt: string) {
  try {
    const p = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(
      decodeURIComponent(
        escape(atob(p + "=".repeat((4 - (p.length % 4)) % 4)))
      )
    );
  } catch {
    return null;
  }
}

/* ── helper: extract codes from mail ── */
function extractCodes(subject: string, body: string): string[] {
  const text = (subject || "") + " \n" + (body || "");
  const found: string[] = [];
  (text.match(/\b\d{4,8}\b/g) || []).forEach((c) => {
    if (!found.includes(c)) found.push(c);
  });
  (
    text.match(
      /(?:code|код|verification|подтвержд[а-я]*|pin|пин)[^\d]{0,30}(\d{4,8})/gi
    ) || []
  ).forEach((s) => {
    const d = s.match(/\d{4,8}/);
    if (d && !found.includes(d[0])) found.push(d[0]);
  });
  return found.slice(0, 4);
}

export default function MailModule() {
  const [view, setView] = useState<View>("setup");
  const [domains, setDomains] = useState<string[]>(["freelance-gid.online"]);
  const [domain, setDomain] = useState("freelance-gid.online");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const [mailbox, setMailbox] = useState<MailAddress | null>(null);
  const [mails, setMails] = useState<MailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMail, setSelectedMail] = useState<MailMessage | null>(null);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const lastCountRef = useRef(0);

  /* ── load domains on mount ── */
  useEffect(() => {
    fetch(WORKER + "/open_api/settings")
      .then((r) => r.json())
      .then((s) => {
        if (s.domains?.length) {
          setDomains(s.domains);
          setDomain(s.domains[0]);
        }
      })
      .catch(() => {});
  }, []);

  /* ── poll for mails ── */
  const fetchMails = useCallback(
    async (jwt: string) => {
      try {
        const r = await fetch(WORKER + "/api/mails?limit=30&offset=0", {
          headers: { Authorization: "Bearer " + jwt },
        });
        const d = await r.json();
        if (d.results) {
          setMails(d.results);
          // Play sound/notify if new
          if (d.results.length > lastCountRef.current && lastCountRef.current > 0) {
            // Could add notification here
          }
          lastCountRef.current = d.results.length;
        }
      } catch {
        // silently retry
      }
    },
    []
  );

  const startPolling = useCallback(
    (jwt: string) => {
      if (pollRef.current) clearInterval(pollRef.current);
      fetchMails(jwt);
      pollRef.current = setInterval(() => fetchMails(jwt), 5000);
    },
    [fetchMails]
  );

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  /* ── create address ── */
  const handleCreate = useCallback(async () => {
    setCreating(true);
    try {
      const body: Record<string, string> = { domain };
      if (name.trim()) body.name = name.trim();
      const r = await fetch(WORKER + "/api/new_address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok || !d.address) {
        alert("Ошибка: " + (d.message || d.error || r.status));
        setCreating(false);
        return;
      }
      const mb: MailAddress = {
        address: d.address,
        jwt: d.jwt,
        created: Date.now(),
      };
      setMailbox(mb);
      setMails([]);
      lastCountRef.current = 0;
      setView("inbox");
      startPolling(d.jwt);
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(d.address);
      } catch {}
    } catch (e: any) {
      alert("Ошибка сети: " + e.message);
    }
    setCreating(false);
  }, [domain, name, startPolling]);

  /* ── copy to clipboard ── */
  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  }, []);

  /* ── format date ── */
  const fmtDate = (ts: string) => {
    try {
      const d = new Date(ts);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      if (diff < 60000) return "только что";
      if (diff < 3600000) return Math.floor(diff / 60000) + " мин";
      if (diff < 86400000) return Math.floor(diff / 3600000) + " ч";
      return d.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return "";
    }
  };

  /* ════════════════════════════════════════
     SETUP VIEW
     ════════════════════════════════════════ */
  if (view === "setup") {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="ic-xl text-g-text3 mb-4">
            <svg viewBox="0 0 24 24">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-g-text mb-1">
            Временная почта.
          </h2>
          <p className="text-[13px] text-g-text3 mb-6">
            Создать адрес. Получать электронные письма.
          </p>

          {/* Name input */}
          <div className="w-full max-w-[360px] mb-3">
            <div className="flex items-stretch rounded-g border border-g-border2 overflow-hidden focus-within:border-g-accent/40 transition-colors">
              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(
                    e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, "")
                  )
                }
                placeholder="имя (пустое = случайное)"
                className="flex-1 bg-transparent px-3 py-2.5 text-[13px] text-g-text font-mono placeholder:text-g-text3/40 outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
              />
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="bg-g-panel2 border-l border-g-border2 px-3 py-2.5 text-[12px] text-g-text3 font-mono outline-none cursor-pointer"
              >
                {domains.map((d) => (
                  <option key={d} value={d}>
                    @{d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Create button */}
          <button
            onClick={handleCreate}
            disabled={creating}
            className="btn-primary flex items-center gap-2"
          >
            {creating ? (
              <span className="w-4 h-4 border-2 border-g-bg/30 border-t-g-bg rounded-full animate-spin" />
            ) : (
              <span className="ic-sm">
                <svg viewBox="0 0 24 24">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </span>
            )}
            Создать адрес
          </button>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     READING VIEW
     ════════════════════════════════════════ */
  if (view === "reading" && selectedMail) {
    const codes = extractCodes(
      selectedMail.subject || "",
      selectedMail.text || selectedMail.html || ""
    );
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-g-border flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setSelectedMail(null);
              setView("inbox");
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
          <div className="text-[12px] text-g-text3 font-mono truncate flex-1">
            {selectedMail.from}
          </div>
          <span className="text-[11px] text-g-text3">
            {fmtDate(selectedMail.created_at)}
          </span>
        </div>

        {/* Subject + codes */}
        <div className="px-4 py-3 border-b border-g-border shrink-0">
          <h3 className="text-[14px] text-g-text font-medium mb-1">
            {selectedMail.subject || "(без темы)"}
          </h3>
          {codes.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {codes.map((code) => (
                <button
                  key={code}
                  onClick={() => copyText(code)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-g-code/[.08] border border-g-code/30 text-g-code text-[12px] font-mono font-medium hover:bg-g-code/[.15] transition-colors cursor-pointer"
                  title="Копировать код"
                >
                  {code}
                  <span className="ic-sm">
                    <svg viewBox="0 0 24 24">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4">
          {selectedMail.html ? (
            <div
              className="mail-body text-[13px] text-g-text2 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: selectedMail.html }}
            />
          ) : (
            <pre className="text-[13px] text-g-text2 leading-relaxed whitespace-pre-wrap font-sans">
              {selectedMail.text || "(пустое письмо)"}
            </pre>
          )}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════
     INBOX VIEW
     ════════════════════════════════════════ */
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-g-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="ic-sm text-g-accent shrink-0">
            <svg viewBox="0 0 24 24">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </span>
          <span className="font-mono text-[12px] text-g-text truncate">
            {mailbox?.address}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => copyText(mailbox?.address || "")}
            className="btn-icon"
            title="Копировать адрес"
          >
            <span className="ic-sm">
              <svg viewBox="0 0 24 24">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </span>
          </button>
          <button
            onClick={() => mailbox && fetchMails(mailbox.jwt)}
            className="btn-icon"
            title="Обновить"
          >
            <span className="ic-sm">
              <svg viewBox="0 0 24 24">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </span>
          </button>
          <button
            onClick={() => {
              if (pollRef.current) clearInterval(pollRef.current);
              setMailbox(null);
              setMails([]);
              setName("");
              setView("setup");
            }}
            className="btn-icon"
            title="Новый адрес"
          >
            <span className="ic-sm">
              <svg viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-1.5 border-b border-g-border flex items-center justify-between shrink-0">
        <span className="flex items-center gap-1.5 text-[11px] text-g-text3">
          <span className="w-[6px] h-[6px] rounded-full bg-g-green animate-pulse" />
          Автообновление каждые 5с
        </span>
        <span className="text-[11px] font-mono text-g-text3">
          {mails.length} {mails.length === 1 ? "письмо" : mails.length < 5 ? "письма" : "писем"}
        </span>
      </div>

      {/* Mail list */}
      <div className="flex-1 overflow-auto">
        {mails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-5 select-none">
            <div className="ic-lg text-g-text3/30 mb-3">
              <svg viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <div className="text-[13px] text-g-text3 mb-1">Входящих нет</div>
            <div className="text-[11px] text-g-text3/60 text-center leading-relaxed">
              Используйте адрес для регистрации.
              <br />
              Письма появятся здесь автоматически.
            </div>
          </div>
        ) : (
          <ul>
            {mails.map((mail) => {
              const codes = extractCodes(
                mail.subject || "",
                mail.text || ""
              );
              return (
                <li
                  key={mail.id}
                  onClick={() => {
                    setSelectedMail(mail);
                    setView("reading");
                  }}
                  className="flex items-start gap-3 px-4 py-3 border-b border-g-border cursor-pointer hover:bg-[rgba(255,255,255,.02)] active:bg-[rgba(255,255,255,.05)] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13px] text-g-text font-medium truncate">
                        {mail.subject || "(без темы)"}
                      </span>
                    </div>
                    <div className="text-[11px] text-g-text3 truncate mb-1">
                      {mail.from}
                    </div>
                    {codes.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {codes.map((code) => (
                          <span
                            key={code}
                            onClick={(e) => {
                              e.stopPropagation();
                              copyText(code);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-g-code/[.08] border border-g-code/30 text-g-code cursor-pointer hover:bg-g-code/[.15] transition-colors"
                          >
                            {code}
                            <span className="ic-sm" style={{ width: 10, height: 10 }}>
                              <svg viewBox="0 0 24 24" style={{ width: 10, height: 10 }}>
                                <rect x="9" y="9" width="13" height="13" rx="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-g-text3 shrink-0 mt-0.5">
                    {fmtDate(mail.created_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
