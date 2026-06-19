// ── Grouvi AI Store (localStorage) ──
import { Conversation, AppSettings, DEFAULT_SETTINGS } from "./types";

const CONV_KEY = "grouvi_ai_conversations";
const SETTINGS_KEY = "grouvi_ai_settings";
const ACTIVE_KEY = "grouvi_ai_active";

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(CONV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveConversations(convs: Conversation[]) {
  localStorage.setItem(CONV_KEY, JSON.stringify(convs));
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (!saved.apiKey && DEFAULT_SETTINGS.apiKey) delete saved.apiKey;
      return { ...DEFAULT_SETTINGS, ...saved };
    }
    return { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function loadActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function saveActiveId(id: string | null) {
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function newConversation(model: string): Conversation {
  return {
    id: uid(),
    title: "Новый чат",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    model,
  };
}
