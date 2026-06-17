import React, { useState, useCallback, useEffect, useRef } from "react";

/* ── MaDLeeTs Supabase config ── */
const SB = "https://sxglrllialxihqowmqwh.supabase.co";
const KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4Z2xybGxpYWx4aWhxb3dtcXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjE2NjQsImV4cCI6MjA4MzY5NzY2NH0.mCivzbRAqNkJ1BA8ag4mt6vHlUjV5lWUguhGb4mmKc0";

const sbHeaders = { apikey: KEY, Authorization: `Bearer ${KEY}` };

type Tab = "gen" | "bin" | "live" | "hot";

/* ── Luhn helpers ── */
function luhnChecksum(partial: string): number {
  const digits = partial.split("").map(Number).reverse();
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = digits[i];
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}

function generateCard(
  bin: string,
  month: string,
  year: string,
  cvv: string
): string {
  const totalLen = bin.length <= 8 ? 16 : bin.length <= 12 ? 16 : 19;
  let num = bin;
  while (num.length < totalLen - 1) {
    num += Math.floor(Math.random() * 10);
  }
  num += luhnChecksum(num);

  const mm =
    month === "random"
      ? String(Math.floor(Math.random() * 12) + 1).padStart(2, "0")
      : month;
  const yy =
    year === "random"
      ? String(new Date().getFullYear() + Math.floor(Math.random() * 5) + 1).slice(-2)
      : year;
  const cv =
    cvv.trim() === ""
      ? String(Math.floor(Math.random() * 900) + 100)
      : cvv;

  return `${num}|${mm}|${yy}|${cv}`;
}

/* ── BIN info type ── */
interface BinInfo {
  bin: string;
  scheme: string;
  type: string;
  brand: string;
  prepaid?: boolean;
  country?: { name: string; emoji: string; alpha2: string; currency: string };
  bank?: { name: string };
}

interface HotBin {
  id: string;
  bin: string;
  description: string;
  working_votes: number;
  not_working_votes: number;
}

interface CheckResult {
  card: string;
  code: number;
  status: string;
  message: string;
}

export default function CardModule() {
  const [tab, setTab] = useState<Tab>("gen");

  /* ── Generator state ── */
  const [bin, setBin] = useState("424242");
  const [month, setMonth] = useState("random");
  const [year, setYear] = useState("random");
  const [cvv, setCvv] = useState("");
  const [qty, setQty] = useState(10);
  const [output, setOutput] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  /* ── BIN Checker state ── */
  const [binQuery, setBinQuery] = useState("");
  const [binResult, setBinResult] = useState<BinInfo | null>(null);
  const [binLoading, setBinLoading] = useState(false);
  const [binError, setBinError] = useState("");

  /* ── Live Checker state ── */
  const [liveInput, setLiveInput] = useState("");
  const [liveResults, setLiveResults] = useState<CheckResult[]>([]);
  const [liveChecking, setLiveChecking] = useState(false);

  /* ── Hot BINs state ── */
  const [hotBins, setHotBins] = useState<HotBin[]>([]);
  const [hotLoading, setHotLoading] = useState(false);

  /* ── Clipboard ── */
  const copyText = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }, []);

  /* ── Load hot bins on tab switch ── */
  useEffect(() => {
    if (tab === "hot" && hotBins.length === 0) {
      setHotLoading(true);
      fetch(
        `${SB}/rest/v1/useful_bins?select=*&is_active=eq.true&order=created_at.desc`,
        { headers: sbHeaders }
      )
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setHotBins(data);
        })
        .catch(() => {})
        .finally(() => setHotLoading(false));
    }
  }, [tab]);

  /* ── Generate cards ── */
  const handleGenerate = useCallback(() => {
    if (!bin.trim() || bin.trim().length < 4) return;
    const cards: string[] = [];
    for (let i = 0; i < qty; i++) {
      cards.push(generateCard(bin.trim(), month, year, cvv));
    }
    setOutput(cards);
  }, [bin, month, year, cvv, qty]);

  /* ── BIN lookup ── */
  const handleBinLookup = useCallback(async () => {
    const q = binQuery.trim().replace(/\D/g, "");
    if (q.length < 6) {
      setBinError("Минимум 6 цифр");
      return;
    }
    setBinLoading(true);
    setBinError("");
    setBinResult(null);
    try {
      const r = await fetch(`${SB}/functions/v1/bin-lookup?bin=${q}`, {
        headers: sbHeaders,
      });
      if (!r.ok) {
        const e = await r.json();
        setBinError(e.error || `Ошибка ${r.status}`);
      } else {
        setBinResult(await r.json());
      }
    } catch (e: any) {
      setBinError("Сеть: " + e.message);
    }
    setBinLoading(false);
  }, [binQuery]);

  /* ── Live check ── */
  const handleLiveCheck = useCallback(async () => {
    const lines = liveInput
      .trim()
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    setLiveChecking(true);
    const results: CheckResult[] = [];
    for (const line of lines.slice(0, 10)) {
      try {
        const r = await fetch(`${SB}/functions/v1/check-card`, {
          method: "POST",
          headers: { ...sbHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({ card: line }),
        });
        results.push(await r.json());
      } catch {
        results.push({
          card: line,
          code: -1,
          status: "Error",
          message: "Ошибка сети",
        });
      }
    }
    setLiveResults(results);
    setLiveChecking(false);
  }, [liveInput]);

  /* ── Tab bar ── */
  const tabs: { id: Tab; label: string }[] = [
    { id: "gen", label: "Генератор" },
    { id: "bin", label: "BIN Check" },
    { id: "live", label: "CC Live" },
    { id: "hot", label: "Hot BINs" },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="px-3 pt-2 pb-0 border-b border-g-border flex gap-0.5 shrink-0">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-[11px] font-medium rounded-t-md transition-colors ${
              tab === t.id
                ? "bg-[rgba(255,255,255,.06)] text-g-text border-b-2 border-g-accent"
                : "text-g-text3 hover:text-g-text hover:bg-[rgba(255,255,255,.03)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ GENERATOR TAB ═══ */}
      {tab === "gen" && (
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* BIN */}
            <div className="col-span-2">
              <label className="text-[10px] text-g-text3 uppercase tracking-wider mb-1 block">
                BIN номер
              </label>
              <input
                type="text"
                value={bin}
                onChange={(e) =>
                  setBin(e.target.value.replace(/[^0-9]/g, "").slice(0, 16))
                }
                placeholder="424242"
                className="w-full bg-transparent border border-g-border2 rounded-g px-3 py-2 text-[13px] text-g-text font-mono placeholder:text-g-text3/40 outline-none focus:border-g-accent/40 transition-colors"
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>

            {/* Month */}
            <div>
              <label className="text-[10px] text-g-text3 uppercase tracking-wider mb-1 block">
                Месяц
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-g-panel2 border border-g-border2 rounded-g px-3 py-2 text-[13px] text-g-text outline-none cursor-pointer"
              >
                <option value="random">Случайный</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={String(i + 1).padStart(2, "0")}>
                    {String(i + 1).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div>
              <label className="text-[10px] text-g-text3 uppercase tracking-wider mb-1 block">
                Год
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-g-panel2 border border-g-border2 rounded-g px-3 py-2 text-[13px] text-g-text outline-none cursor-pointer"
              >
                <option value="random">Случайный</option>
                {Array.from({ length: 8 }, (_, i) => {
                  const y = new Date().getFullYear() + i;
                  return (
                    <option key={y} value={String(y).slice(-2)}>
                      {y}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* CVV */}
            <div>
              <label className="text-[10px] text-g-text3 uppercase tracking-wider mb-1 block">
                CVV
              </label>
              <input
                type="text"
                value={cvv}
                onChange={(e) =>
                  setCvv(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))
                }
                placeholder="Случайный"
                className="w-full bg-transparent border border-g-border2 rounded-g px-3 py-2 text-[13px] text-g-text font-mono placeholder:text-g-text3/40 outline-none focus:border-g-accent/40 transition-colors"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="text-[10px] text-g-text3 uppercase tracking-wider mb-1 block">
                Количество
              </label>
              <input
                type="number"
                value={qty}
                onChange={(e) =>
                  setQty(Math.max(1, Math.min(50, Number(e.target.value))))
                }
                min={1}
                max={50}
                className="w-full bg-transparent border border-g-border2 rounded-g px-3 py-2 text-[13px] text-g-text font-mono outline-none focus:border-g-accent/40 transition-colors"
              />
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            className="btn-primary w-full flex items-center justify-center gap-2 mb-3"
          >
            <span className="ic-sm">
              <svg viewBox="0 0 24 24">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </span>
            Генерировать
          </button>

          {/* Output */}
          {output.length > 0 && (
            <div className="border border-g-border2 rounded-g overflow-hidden">
              <div className="px-3 py-2 border-b border-g-border flex items-center justify-between">
                <span className="text-[11px] text-g-text3 font-medium">
                  Результат ({output.length})
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => copyText(output.join("\n"))}
                    className="btn-icon text-[10px] flex items-center gap-1"
                    title="Копировать все"
                  >
                    <span className="ic-sm">
                      <svg viewBox="0 0 24 24">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </span>
                    {copied ? "Скопировано" : "Копировать"}
                  </button>
                  <button
                    onClick={() => {
                      setLiveInput(output.join("\n"));
                      setTab("live");
                    }}
                    className="btn-icon text-[10px] flex items-center gap-1"
                    title="Проверить на live"
                  >
                    <span className="ic-sm">
                      <svg viewBox="0 0 24 24">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </span>
                    Live
                  </button>
                </div>
              </div>
              <div className="max-h-[200px] overflow-auto p-2">
                {output.map((card, i) => (
                  <div
                    key={i}
                    onClick={() => copyText(card)}
                    className="text-[12px] font-mono text-g-text2 py-0.5 px-2 rounded hover:bg-[rgba(255,255,255,.04)] cursor-pointer transition-colors"
                  >
                    {card}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ BIN CHECKER TAB ═══ */}
      {tab === "bin" && (
        <div className="flex-1 overflow-auto p-4">
          <div className="flex flex-col items-center justify-center">
            <div className="ic-lg text-g-text3 mb-3">
              <svg viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="text-[15px] font-semibold text-g-text mb-1">
              BIN Checker
            </h3>
            <p className="text-[12px] text-g-text3 mb-4 text-center">
              Введите первые 6-8 цифр карты для определения банка, страны, типа
            </p>

            <div className="w-full max-w-[360px] mb-3">
              <div className="flex items-stretch rounded-g border border-g-border2 overflow-hidden focus-within:border-g-accent/40 transition-colors">
                <input
                  type="text"
                  value={binQuery}
                  onChange={(e) =>
                    setBinQuery(
                      e.target.value.replace(/[^0-9]/g, "").slice(0, 11)
                    )
                  }
                  placeholder="424242"
                  className="flex-1 bg-transparent px-3 py-2.5 text-[13px] text-g-text font-mono placeholder:text-g-text3/40 outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleBinLookup()}
                  autoFocus
                />
                <button
                  onClick={handleBinLookup}
                  disabled={binLoading}
                  className="px-4 bg-g-panel2 border-l border-g-border2 text-[12px] text-g-text font-medium hover:bg-[rgba(255,255,255,.06)] transition-colors"
                >
                  {binLoading ? "..." : "Проверить"}
                </button>
              </div>
              {binError && (
                <div className="text-[11px] text-red-400 mt-1.5">{binError}</div>
              )}
            </div>

            {binResult && (
              <div className="w-full max-w-[360px] border border-g-border2 rounded-g overflow-hidden">
                <div className="px-3 py-2 bg-g-panel2 border-b border-g-border">
                  <span className="text-[11px] text-g-text3 font-medium">
                    BIN {binResult.bin}
                  </span>
                </div>
                <div className="divide-y divide-g-border">
                  {[
                    ["Схема", binResult.scheme?.toUpperCase()],
                    ["Тип", binResult.type],
                    ["Бренд", binResult.brand],
                    [
                      "Prepaid",
                      binResult.prepaid ? "Да" : binResult.prepaid === false ? "Нет" : "—",
                    ],
                    [
                      "Страна",
                      binResult.country
                        ? `${binResult.country.emoji} ${binResult.country.name} (${binResult.country.alpha2})`
                        : "—",
                    ],
                    ["Банк", binResult.bank?.name || "—"],
                    ["Валюта", binResult.country?.currency || "—"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="px-3 py-2 flex items-center justify-between"
                    >
                      <span className="text-[11px] text-g-text3 uppercase tracking-wider">
                        {label}
                      </span>
                      <span className="text-[12px] text-g-text font-medium">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ LIVE CHECKER TAB ═══ */}
      {tab === "live" && (
        <div className="flex-1 overflow-auto p-4">
          <div className="mb-3">
            <label className="text-[10px] text-g-text3 uppercase tracking-wider mb-1 block">
              Карты (формат: номер|мм|гг|cvv, по одной на строку, макс 10)
            </label>
            <textarea
              value={liveInput}
              onChange={(e) => setLiveInput(e.target.value)}
              placeholder="4242424242424242|12|28|123"
              rows={4}
              className="w-full bg-transparent border border-g-border2 rounded-g px-3 py-2 text-[12px] text-g-text font-mono placeholder:text-g-text3/40 outline-none focus:border-g-accent/40 transition-colors resize-none"
            />
          </div>

          <button
            onClick={handleLiveCheck}
            disabled={liveChecking}
            className="btn-primary w-full flex items-center justify-center gap-2 mb-3"
          >
            {liveChecking ? (
              <span className="w-4 h-4 border-2 border-g-bg/30 border-t-g-bg rounded-full animate-spin" />
            ) : (
              <span className="ic-sm">
                <svg viewBox="0 0 24 24">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </span>
            )}
            {liveChecking ? "Проверка..." : "Проверить"}
          </button>

          {liveResults.length > 0 && (
            <div className="border border-g-border2 rounded-g overflow-hidden">
              <div className="px-3 py-2 border-b border-g-border">
                <span className="text-[11px] text-g-text3 font-medium">
                  Результаты ({liveResults.length})
                </span>
              </div>
              <div className="divide-y divide-g-border max-h-[250px] overflow-auto">
                {liveResults.map((r, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 flex items-start gap-2"
                  >
                    <span
                      className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${
                        r.status === "Live"
                          ? "bg-g-green"
                          : r.status === "Dead"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-mono text-g-text truncate">
                        {r.card}
                      </div>
                      <div
                        className={`text-[10px] ${
                          r.status === "Live"
                            ? "text-g-green"
                            : r.status === "Dead"
                            ? "text-red-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {r.status} — {r.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ HOT BINS TAB ═══ */}
      {tab === "hot" && (
        <div className="flex-1 overflow-auto p-4">
          <h3 className="text-[13px] font-semibold text-g-text mb-1">
            Hot BINs
          </h3>
          <p className="text-[11px] text-g-text3 mb-3">
            Проверенные сообществом BIN-номера с голосованием
          </p>

          {hotLoading ? (
            <div className="flex items-center justify-center py-8">
              <span className="w-5 h-5 border-2 border-g-accent/30 border-t-g-accent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {hotBins.map((hb) => {
                const total = hb.working_votes + hb.not_working_votes;
                const pct = total > 0 ? Math.round((hb.working_votes / total) * 100) : 0;
                return (
                  <div
                    key={hb.id}
                    className="border border-g-border2 rounded-g p-3 hover:bg-[rgba(255,255,255,.02)] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className="text-[13px] font-mono text-g-accent font-semibold cursor-pointer hover:underline"
                        onClick={() => {
                          setBin(hb.bin);
                          setTab("gen");
                        }}
                        title="Использовать для генерации"
                      >
                        {hb.bin}
                      </span>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span
                          className={`font-bold ${
                            pct >= 60
                              ? "text-g-green"
                              : pct >= 40
                              ? "text-yellow-400"
                              : "text-red-400"
                          }`}
                        >
                          {pct}%
                        </span>
                        <span className="text-g-text3">
                          {hb.working_votes}↑ {hb.not_working_votes}↓
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-g-text3">
                      {hb.description}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-1.5 h-1 bg-g-border2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 60
                            ? "bg-g-green"
                            : pct >= 40
                            ? "bg-yellow-400"
                            : "bg-red-400"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
