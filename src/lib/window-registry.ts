export interface ModuleDef {
  id: string;
  title: string;
  description: string;
  category: string;
  component: string;
}

export const MODULE_REGISTRY: ModuleDef[] = [
  {
    id: "mail",
    title: "Временная почта",
    description: "Создание временных email-адресов, получение писем",
    category: "tools",
    component: "mail",
  },
  {
    id: "ai-chat",
    title: "AI Chat",
    description: "Чат с нейросетями через OmniRoute или OpenAI API",
    category: "tools",
    component: "ai-chat",
  },
  {
    id: "cards",
    title: "Временные карты",
    description: "CC генератор, BIN чекер, проверка Live, Hot BINs",
    category: "tools",
    component: "cards",
  },
  {
    id: "notes",
    title: "Заметки",
    description: "Локальный блокнот с поиском, цветами и экспортом",
    category: "productivity",
    component: "notes",
  },
  {
    id: "agent",
    title: "Agent",
    description: "AI-ассистент с доступом к инструментам рабочего стола",
    category: "ai",
    component: "agent",
  },
];
