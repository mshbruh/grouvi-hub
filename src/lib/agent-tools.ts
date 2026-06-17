/* ── Grouvi Agent — Tool definitions & executors ── */

export interface ToolDef {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

/* ── TOOL CATALOGUE ── */
export const TOOLS: ToolDef[] = [
  /* ── Notes ── */
  {
    type: "function",
    function: {
      name: "create_note",
      description: "Создать новую заметку. Возвращает ID созданной заметки.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Заголовок заметки" },
          body: { type: "string", description: "Текст заметки" },
          color: {
            type: "string",
            description: "Цвет метки: red, amber, green, blue, purple, pink или пусто",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_notes",
      description:
        "Показать все заметки пользователя (ID, заголовок, дата, первые 80 символов).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "search_notes",
      description: "Поиск по заметкам (по заголовку и тексту).",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Поисковый запрос" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_note",
      description: "Прочитать полный текст заметки по ID.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID заметки" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_note",
      description: "Удалить заметку по ID.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID заметки" },
        },
        required: ["id"],
      },
    },
  },
  /* ── Cards ── */
  {
    type: "function",
    function: {
      name: "generate_cards",
      description:
        "Сгенерировать тестовые номера карт по BIN (первые 6 цифр). Используется алгоритм Луна.",
      parameters: {
        type: "object",
        properties: {
          bin: { type: "string", description: "BIN (6 цифр)" },
          count: {
            type: "number",
            description: "Количество карт (по умолчанию 10, макс 50)",
          },
          month: { type: "string", description: "Месяц MM или random" },
          year: { type: "string", description: "Год YY или random" },
        },
        required: ["bin"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_bin",
      description:
        "Проверить информацию по BIN: банк, страна, тип карты, уровень.",
      parameters: {
        type: "object",
        properties: {
          bin: { type: "string", description: "BIN (6-8 цифр)" },
        },
        required: ["bin"],
      },
    },
  },
  /* ── Temp Mail ── */
  {
    type: "function",
    function: {
      name: "create_temp_email",
      description: "Создать временный email-адрес через mail.tm.",
      parameters: {
        type: "object",
        properties: {
          username: {
            type: "string",
            description:
              "Желаемый логин (без домена). Если не указан — сгенерируется случайный.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_inbox",
      description: "Проверить входящие письма временной почты.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string", description: "Email-адрес для проверки" },
          token: {
            type: "string",
            description: "JWT-токен от create_temp_email",
          },
        },
        required: ["email", "token"],
      },
    },
  },
  /* ── Web / fetch ── */
  {
    type: "function",
    function: {
      name: "fetch_url",
      description:
        "Загрузить содержимое URL (GET-запрос). Возвращает текст ответа (первые 4000 символов).",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL для загрузки" },
        },
        required: ["url"],
      },
    },
  },
];

/* ── NOTES HELPERS ── */
const NOTES_KEY = "grouvi_notes";
interface Note {
  id: string;
  title: string;
  body: string;
  created: number;
  updated: number;
  pinned: boolean;
  color: string;
}
const COLOR_MAP: Record<string, string> = {
  red: "#ef4444",
  amber: "#f59e0b",
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#a855f7",
  pink: "#ec4899",
};
function loadNotes(): Note[] {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveNotes(notes: Note[]) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}
function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ── CARD GEN (Luhn) ── */
function luhnCheck(num: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i], 10);
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}
function generateLuhnCard(bin: string): string {
  let card = bin;
  while (card.length < 15) card += Math.floor(Math.random() * 10);
  for (let d = 0; d <= 9; d++) {
    const candidate = card + d;
    if (luhnCheck(candidate)) return candidate;
  }
  return card + "0";
}

/* ── TOOL EXECUTOR ── */
export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  try {
    switch (name) {
      /* ── Notes ── */
      case "create_note": {
        const notes = loadNotes();
        const note: Note = {
          id: newId(),
          title: String(args.title || ""),
          body: String(args.body || ""),
          created: Date.now(),
          updated: Date.now(),
          pinned: false,
          color: COLOR_MAP[String(args.color || "")] || "",
        };
        notes.unshift(note);
        saveNotes(notes);
        return JSON.stringify({ ok: true, id: note.id, title: note.title });
      }
      case "list_notes": {
        const notes = loadNotes();
        if (!notes.length) return JSON.stringify({ notes: [], message: "Нет заметок" });
        return JSON.stringify({
          count: notes.length,
          notes: notes.map((n) => ({
            id: n.id,
            title: n.title,
            preview: n.body.slice(0, 80),
            updated: new Date(n.updated).toLocaleString("ru-RU"),
          })),
        });
      }
      case "search_notes": {
        const q = String(args.query || "").toLowerCase();
        const notes = loadNotes().filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.body.toLowerCase().includes(q)
        );
        return JSON.stringify({
          query: args.query,
          found: notes.length,
          notes: notes.map((n) => ({
            id: n.id,
            title: n.title,
            preview: n.body.slice(0, 80),
          })),
        });
      }
      case "read_note": {
        const note = loadNotes().find((n) => n.id === args.id);
        if (!note) return JSON.stringify({ error: "Заметка не найдена" });
        return JSON.stringify({
          id: note.id,
          title: note.title,
          body: note.body,
          created: new Date(note.created).toLocaleString("ru-RU"),
          updated: new Date(note.updated).toLocaleString("ru-RU"),
        });
      }
      case "delete_note": {
        const notes = loadNotes();
        const idx = notes.findIndex((n) => n.id === args.id);
        if (idx === -1) return JSON.stringify({ error: "Заметка не найдена" });
        const deleted = notes.splice(idx, 1)[0];
        saveNotes(notes);
        return JSON.stringify({ ok: true, deleted: deleted.title });
      }

      /* ── Cards ── */
      case "generate_cards": {
        const bin = String(args.bin || "").replace(/\D/g, "").slice(0, 6);
        if (bin.length < 6)
          return JSON.stringify({ error: "BIN должен быть 6 цифр" });
        const count = Math.min(Number(args.count) || 10, 50);
        const cards: string[] = [];
        for (let i = 0; i < count; i++) {
          const num = generateLuhnCard(bin);
          const mm =
            args.month && args.month !== "random"
              ? String(args.month).padStart(2, "0")
              : String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
          const yy =
            args.year && args.year !== "random"
              ? String(args.year).padStart(2, "0")
              : String(Math.floor(Math.random() * 6) + 25);
          const cvv = String(Math.floor(Math.random() * 900) + 100);
          cards.push(`${num}|${mm}|${yy}|${cvv}`);
        }
        return JSON.stringify({ bin, count, cards });
      }
      case "check_bin": {
        const bin = String(args.bin || "").replace(/\D/g, "").slice(0, 8);
        const SUPA =
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4Z2xybGxpYWx4aWhxb3dtcXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMjE2NjQsImV4cCI6MjA4MzY5NzY2NH0.mCivzbRAqNkJ1BA8ag4mt6vHlUjV5lWUguhGb4mmKc0";
        const r = await fetch(
          `https://sxglrllialxihqowmqwh.supabase.co/functions/v1/bin-lookup?bin=${bin}`,
          { headers: { apikey: SUPA, Authorization: `Bearer ${SUPA}` } }
        );
        return JSON.stringify(await r.json());
      }

      /* ── Temp mail ── */
      case "create_temp_email": {
        const domR = await fetch("https://api.mail.tm/domains?page=1");
        const doms = await domR.json();
        const domain = doms?.["hydra:member"]?.[0]?.domain || "mailto.plus";
        const user =
          String(args.username || "") ||
          "grouvi" + Math.random().toString(36).slice(2, 8);
        const email = `${user}@${domain}`;
        const pass = "Gx" + Math.random().toString(36).slice(2, 12) + "!1";
        // Create account
        await fetch("https://api.mail.tm/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: email, password: pass }),
        });
        // Get token
        const tokR = await fetch("https://api.mail.tm/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: email, password: pass }),
        });
        const tok = await tokR.json();
        return JSON.stringify({
          email,
          token: tok.token || null,
          note: "Используй этот token для check_inbox",
        });
      }
      case "check_inbox": {
        const r = await fetch("https://api.mail.tm/messages?page=1", {
          headers: { Authorization: `Bearer ${args.token}` },
        });
        const data = await r.json();
        const msgs = (data?.["hydra:member"] || []).map(
          (m: Record<string, unknown>) => ({
            id: m.id,
            from: (m.from as Record<string, string>)?.address,
            subject: m.subject,
            intro: m.intro,
            date: m.createdAt,
          })
        );
        return JSON.stringify({
          email: args.email,
          count: msgs.length,
          messages: msgs.slice(0, 10),
        });
      }

      /* ── Fetch ── */
      case "fetch_url": {
        const r = await fetch(String(args.url));
        const text = await r.text();
        return JSON.stringify({
          url: args.url,
          status: r.status,
          body: text.slice(0, 4000),
        });
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  } catch (e: unknown) {
    return JSON.stringify({ error: String((e as Error).message || e) });
  }
}
