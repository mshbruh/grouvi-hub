/* ═══════════════════════════════════════════════════
   Grouvi Agent — Tool Definitions & Executors v2
   Phase 1: Notes, Cards, Email, Web
   Phase 2: OmniRoute management, SSH to user's VPS
   ═══════════════════════════════════════════════════ */

// Backend API base (proxied through nginx)
const AGENT_API = "/agent-api";
const AGENT_TOKEN = "grouvi-agent-9x7kR2mW";

/* ── Helper: call agent backend ── */
async function agentFetch(endpoint: string, body: Record<string, unknown>) {
  const r = await fetch(`${AGENT_API}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AGENT_TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  return r.json();
}

/* ══════════════════════════════════════
   Tool function definitions (OpenAI format)
   ══════════════════════════════════════ */

export const TOOLS = [
  // ── Phase 1: Notes ──
  {
    type: "function" as const,
    function: {
      name: "create_note",
      description:
        "Создать новую заметку в модуле Заметки. Возвращает id созданной заметки.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Заголовок заметки" },
          content: { type: "string", description: "Текст заметки" },
          color: {
            type: "string",
            enum: ["default", "red", "orange", "yellow", "green", "blue", "purple"],
            description: "Цвет метки (опционально)",
          },
        },
        required: ["title", "content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_notes",
      description: "Получить список всех заметок (id, title, color, pinned, updatedAt).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_notes",
      description: "Найти заметки по тексту в заголовке или содержимом.",
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
    type: "function" as const,
    function: {
      name: "read_note",
      description: "Прочитать полный текст заметки по id.",
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
    type: "function" as const,
    function: {
      name: "delete_note",
      description: "Удалить заметку по id.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID заметки" },
        },
        required: ["id"],
      },
    },
  },

  // ── Phase 1: Cards ──
  {
    type: "function" as const,
    function: {
      name: "generate_cards",
      description:
        "Сгенерировать номера карт по BIN (первые 6-8 цифр). Использует алгоритм Luhn.",
      parameters: {
        type: "object",
        properties: {
          bin: { type: "string", description: "BIN (6-8 цифр)" },
          count: { type: "number", description: "Количество карт (макс 50)" },
        },
        required: ["bin"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "check_bin",
      description:
        "Проверить информацию о BIN — банк, страна, тип карты, уровень.",
      parameters: {
        type: "object",
        properties: {
          bin: { type: "string", description: "BIN для проверки (6-8 цифр)" },
        },
        required: ["bin"],
      },
    },
  },

  // ── Phase 1: Email ──
  {
    type: "function" as const,
    function: {
      name: "create_temp_email",
      description:
        "Создать временный email-адрес через mail.tm. Возвращает адрес и токен.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "check_inbox",
      description: "Проверить входящие письма временного email.",
      parameters: {
        type: "object",
        properties: {
          token: { type: "string", description: "Токен от create_temp_email" },
        },
        required: ["token"],
      },
    },
  },

  // ── Phase 1: Web ──
  {
    type: "function" as const,
    function: {
      name: "fetch_url",
      description: "Загрузить содержимое URL (текст страницы, API ответ).",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL для загрузки" },
        },
        required: ["url"],
      },
    },
  },

  // ── Phase 2: OmniRoute Management ──
  {
    type: "function" as const,
    function: {
      name: "omniroute_providers",
      description:
        "Управление провайдерами OmniRoute. action: list — список провайдеров; add — добавить (нужны provider, name, apiKey, authType); delete — удалить (нужен id); test — тестировать (нужен id).",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["list", "add", "delete", "test"],
            description: "Действие",
          },
          id: { type: "string", description: "ID провайдера (для delete/test)" },
          provider: { type: "string", description: "Тип провайдера (для add): openai, anthropic, google, openrouter и т.д." },
          name: { type: "string", description: "Имя подключения (для add)" },
          apiKey: { type: "string", description: "API ключ провайдера (для add)" },
          authType: { type: "string", description: "Тип авторизации (для add): apikey, oauth и т.д." },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "omniroute_models",
      description:
        "Список доступных моделей в OmniRoute. Можно получить модели конкретного провайдера.",
      parameters: {
        type: "object",
        properties: {
          providerId: { type: "string", description: "ID провайдера (опционально — фильтр)" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "omniroute_keys",
      description:
        "Управление API ключами OmniRoute. action: list — список ключей; create — создать новый (нужно name); delete — удалить (нужен id); reveal — показать полный ключ (нужен id).",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["list", "create", "delete", "reveal"],
            description: "Действие",
          },
          id: { type: "string", description: "ID ключа (для delete/reveal)" },
          name: { type: "string", description: "Имя нового ключа (для create)" },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "omniroute_settings",
      description:
        "Получить или обновить настройки OmniRoute. action: get — текущие настройки; update — обновить (нужен settings объект).",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["get", "update"],
            description: "Действие",
          },
          settings: {
            type: "object",
            description: "Объект настроек для обновления (для update)",
          },
        },
        required: ["action"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "omniroute_usage",
      description: "Получить логи использования OmniRoute — последние запросы, статистику.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Количество записей (по умолчанию 20)" },
        },
      },
    },
  },

  // ── Phase 2: SSH (user provides credentials) ──
  {
    type: "function" as const,
    function: {
      name: "ssh_connect",
      description:
        "Подключиться к VPS пользователя. Пользователь должен дать host, username и password. Возвращает hostname и подтверждение подключения.",
      parameters: {
        type: "object",
        properties: {
          host: { type: "string", description: "IP-адрес или домен сервера" },
          username: { type: "string", description: "Имя пользователя (по умолчанию root)" },
          password: { type: "string", description: "Пароль SSH" },
          port: { type: "number", description: "Порт SSH (по умолчанию 22)" },
        },
        required: ["host", "password"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "ssh_exec",
      description:
        "Выполнить shell-команду на VPS пользователя. Требует предварительного ssh_connect или передачи creds.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "Команда для выполнения" },
          host: { type: "string", description: "IP сервера (если не было ssh_connect)" },
          username: { type: "string", description: "Логин" },
          password: { type: "string", description: "Пароль" },
          port: { type: "number", description: "Порт (по умолчанию 22)" },
        },
        required: ["command"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "ssh_file_read",
      description: "Прочитать файл на VPS пользователя по SSH.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Полный путь к файлу" },
          host: { type: "string", description: "IP сервера" },
          username: { type: "string", description: "Логин" },
          password: { type: "string", description: "Пароль" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "ssh_file_write",
      description: "Записать файл на VPS пользователя по SSH.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Полный путь к файлу" },
          content: { type: "string", description: "Содержимое файла" },
          host: { type: "string", description: "IP сервера" },
          username: { type: "string", description: "Логин" },
          password: { type: "string", description: "Пароль" },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "ssh_status",
      description:
        "Статус VPS пользователя: диск, память, аптайм, Docker. Требует SSH credentials.",
      parameters: {
        type: "object",
        properties: {
          host: { type: "string", description: "IP сервера" },
          username: { type: "string", description: "Логин" },
          password: { type: "string", description: "Пароль" },
        },
      },
    },
  },
];

/* ══════════════════════════════════════
   Tool Executors
   ══════════════════════════════════════ */

/* ── Notes helpers (localStorage) ── */
const NOTES_KEY = "grouvi_notes";
interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}
function getNotes(): Note[] {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || "[]"); }
  catch { return []; }
}
function saveNotes(notes: Note[]) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

/* ── Card generation (Luhn) ── */
function luhnGenerate(partial: string): string {
  const digits = partial.split("").map(Number);
  const parity = digits.length % 2;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = digits[i];
    if (i % 2 === parity) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  const check = (10 - (sum % 10)) % 10;
  return partial + check;
}

/* ── BIN Check (MaDLeeTs Supabase) ── */
const MADLEETS_URL = "https://cqbjbjftfzyxnrsmjnap.supabase.co/rest/v1/rpc/bin_lookup";
const MADLEETS_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxYmpiamZ0Znp5eG5yc21qbmFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NTUwODEsImV4cCI6MjA0NjMzMTA4MX0.E3KNrag1mKZbSifdNFQidPjD1DT3dWJJaaPqP3ZMDFU";

/* ═══ Main executor ═══ */
export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  try {
    switch (name) {
      // ── Notes ──
      case "create_note": {
        const note: Note = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          title: (args.title as string) || "Без названия",
          content: (args.content as string) || "",
          color: (args.color as string) || "default",
          pinned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const notes = getNotes();
        notes.unshift(note);
        saveNotes(notes);
        return JSON.stringify({ ok: true, id: note.id, title: note.title });
      }

      case "list_notes": {
        const notes = getNotes();
        const list = notes.map((n) => ({
          id: n.id, title: n.title, color: n.color, pinned: n.pinned,
          updatedAt: n.updatedAt,
        }));
        return JSON.stringify({ count: list.length, notes: list });
      }

      case "search_notes": {
        const q = ((args.query as string) || "").toLowerCase();
        const notes = getNotes().filter(
          (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
        );
        return JSON.stringify({
          count: notes.length,
          notes: notes.map((n) => ({ id: n.id, title: n.title, snippet: n.content.slice(0, 100) })),
        });
      }

      case "read_note": {
        const note = getNotes().find((n) => n.id === args.id);
        if (!note) return JSON.stringify({ error: "Заметка не найдена" });
        return JSON.stringify(note);
      }

      case "delete_note": {
        const notes = getNotes();
        const idx = notes.findIndex((n) => n.id === args.id);
        if (idx === -1) return JSON.stringify({ error: "Заметка не найдена" });
        notes.splice(idx, 1);
        saveNotes(notes);
        return JSON.stringify({ ok: true, deleted: args.id });
      }

      // ── Cards ──
      case "generate_cards": {
        const bin = (args.bin as string) || "";
        if (bin.length < 6) return JSON.stringify({ error: "BIN должен быть 6-8 цифр" });
        const count = Math.min(Number(args.count) || 10, 50);
        const cards: string[] = [];
        for (let i = 0; i < count; i++) {
          let partial = bin;
          while (partial.length < 15) partial += Math.floor(Math.random() * 10);
          cards.push(luhnGenerate(partial.slice(0, 15)));
        }
        return JSON.stringify({ cards, count: cards.length });
      }

      case "check_bin": {
        const bin = (args.bin as string) || "";
        const r = await fetch(MADLEETS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: MADLEETS_KEY,
            Authorization: `Bearer ${MADLEETS_KEY}`,
          },
          body: JSON.stringify({ input_bin: bin }),
        });
        const data = await r.json();
        return JSON.stringify(data);
      }

      // ── Email ──
      case "create_temp_email": {
        const domR = await fetch("https://api.mail.tm/domains");
        const domData = await domR.json();
        const domain = domData["hydra:member"]?.[0]?.domain || "mail.tm";
        const user = "grouvi" + Math.random().toString(36).slice(2, 8);
        const email = `${user}@${domain}`;
        const pwd = "Gx" + Math.random().toString(36).slice(2, 12) + "!1";
        await fetch("https://api.mail.tm/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: email, password: pwd }),
        });
        const tokR = await fetch("https://api.mail.tm/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: email, password: pwd }),
        });
        const tokData = await tokR.json();
        return JSON.stringify({ email, token: tokData.token || null });
      }

      case "check_inbox": {
        const token = args.token as string;
        const r = await fetch("https://api.mail.tm/messages?page=1", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await r.json();
        const msgs = (data["hydra:member"] || []).map(
          (m: Record<string, unknown>) => ({
            id: m.id, from: (m.from as Record<string, string>)?.address,
            subject: m.subject, intro: m.intro, createdAt: m.createdAt,
          })
        );
        return JSON.stringify({ count: msgs.length, messages: msgs });
      }

      // ── Web ──
      case "fetch_url": {
        const r = await fetch(args.url as string);
        const text = await r.text();
        return text.slice(0, 8000);
      }

      // ── OmniRoute Management ──
      case "omniroute_providers": {
        const action = args.action as string;
        if (action === "list") {
          return JSON.stringify(await agentFetch("/omni", { method: "GET", path: "/api/providers" }));
        }
        if (action === "add") {
          return JSON.stringify(await agentFetch("/omni", {
            method: "POST", path: "/api/providers",
            payload: { provider: args.provider, name: args.name, apiKey: args.apiKey, authType: args.authType || "apikey" },
          }));
        }
        if (action === "delete") {
          return JSON.stringify(await agentFetch("/omni", { method: "DELETE", path: `/api/providers/${args.id}` }));
        }
        if (action === "test") {
          return JSON.stringify(await agentFetch("/omni", { method: "POST", path: `/api/providers/${args.id}/test` }));
        }
        return JSON.stringify({ error: "Unknown action" });
      }

      case "omniroute_models": {
        const path = args.providerId
          ? `/api/providers/${args.providerId}/models`
          : "/api/models";
        return JSON.stringify(await agentFetch("/omni", { method: "GET", path }));
      }

      case "omniroute_keys": {
        const action = args.action as string;
        if (action === "list") {
          return JSON.stringify(await agentFetch("/omni", { method: "GET", path: "/api/keys" }));
        }
        if (action === "create") {
          return JSON.stringify(await agentFetch("/omni", {
            method: "POST", path: "/api/keys",
            payload: { name: args.name || "agent-key" },
          }));
        }
        if (action === "delete") {
          return JSON.stringify(await agentFetch("/omni", { method: "DELETE", path: `/api/keys/${args.id}` }));
        }
        if (action === "reveal") {
          return JSON.stringify(await agentFetch("/omni", { method: "GET", path: `/api/keys/${args.id}/reveal` }));
        }
        return JSON.stringify({ error: "Unknown action" });
      }

      case "omniroute_settings": {
        const action = args.action as string;
        if (action === "get") {
          return JSON.stringify(await agentFetch("/omni", { method: "GET", path: "/api/settings" }));
        }
        if (action === "update") {
          return JSON.stringify(await agentFetch("/omni", {
            method: "PUT", path: "/api/settings",
            payload: args.settings as Record<string, unknown>,
          }));
        }
        return JSON.stringify({ error: "Unknown action" });
      }

      case "omniroute_usage": {
        const limit = Number(args.limit) || 20;
        return JSON.stringify(await agentFetch("/omni", { method: "GET", path: `/api/usage/logs?limit=${limit}` }));
      }

      // ── SSH (user VPS) ──
      case "ssh_connect": {
        const creds = { host: args.host as string, username: (args.username as string) || "root", password: args.password as string, port: args.port as number };
        // Store creds in sessionStorage for reuse
        sessionStorage.setItem("grouvi_ssh_creds", JSON.stringify(creds));
        return JSON.stringify(await agentFetch("/ssh/connect", { creds }));
      }

      case "ssh_exec": {
        const stored = JSON.parse(sessionStorage.getItem("grouvi_ssh_creds") || "{}");
        const creds = {
          host: (args.host as string) || stored.host,
          username: (args.username as string) || stored.username || "root",
          password: (args.password as string) || stored.password,
          port: (args.port as number) || stored.port,
        };
        if (!creds.host || !creds.password) return JSON.stringify({ error: "Нет SSH credentials. Сначала используй ssh_connect." });
        return JSON.stringify(await agentFetch("/ssh/exec", { creds, command: args.command as string }));
      }

      case "ssh_file_read": {
        const stored = JSON.parse(sessionStorage.getItem("grouvi_ssh_creds") || "{}");
        const creds = {
          host: (args.host as string) || stored.host,
          username: (args.username as string) || stored.username || "root",
          password: (args.password as string) || stored.password,
        };
        if (!creds.host || !creds.password) return JSON.stringify({ error: "Нет SSH credentials." });
        return JSON.stringify(await agentFetch("/ssh/file/read", { creds, path: args.path as string }));
      }

      case "ssh_file_write": {
        const stored = JSON.parse(sessionStorage.getItem("grouvi_ssh_creds") || "{}");
        const creds = {
          host: (args.host as string) || stored.host,
          username: (args.username as string) || stored.username || "root",
          password: (args.password as string) || stored.password,
        };
        if (!creds.host || !creds.password) return JSON.stringify({ error: "Нет SSH credentials." });
        return JSON.stringify(await agentFetch("/ssh/file/write", { creds, path: args.path as string, content: args.content as string }));
      }

      case "ssh_status": {
        const stored = JSON.parse(sessionStorage.getItem("grouvi_ssh_creds") || "{}");
        const creds = {
          host: (args.host as string) || stored.host,
          username: (args.username as string) || stored.username || "root",
          password: (args.password as string) || stored.password,
        };
        if (!creds.host || !creds.password) return JSON.stringify({ error: "Нет SSH credentials." });
        return JSON.stringify(await agentFetch("/ssh/status", { creds }));
      }

      default:
        return JSON.stringify({ error: `Неизвестный инструмент: ${name}` });
    }
  } catch (e) {
    return JSON.stringify({ error: (e as Error).message });
  }
}
