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
];
