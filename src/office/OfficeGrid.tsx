import React from "react";
import type { Agent, FeedMessage } from "./types";
import AgentCard from "./AgentCard";

interface OfficeGridProps {
  agents: Agent[];
  feed: FeedMessage[];
  onSelectAgent: (id: string) => void;
}

export default function OfficeGrid({ agents, feed, onSelectAgent }: OfficeGridProps) {
  // Get last activity per agent
  const lastActivity: Record<string, FeedMessage> = {};
  for (const msg of feed) {
    lastActivity[msg.agentId] = msg;
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Hero section */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold text-g-text">
            Добро пожаловать в офис
          </h1>
          <p className="text-sm text-g-text3 mt-1">
            Ваша AI-команда готова к работе. Нажмите на агента для общения или создайте задачу для всей команды.
          </p>
        </div>
      </div>

      {/* Agent grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            lastActivity={lastActivity[agent.id]}
            onClick={() => onSelectAgent(agent.id)}
          />
        ))}
      </div>

      {/* Quick stats */}
      <div className="max-w-5xl mx-auto mt-8 grid grid-cols-3 gap-4">
        <div className="bg-g-bg2 rounded-xl p-4 border border-g-border">
          <div className="text-2xl font-bold text-g-text">{agents.length}</div>
          <div className="text-xs text-g-text3 mt-1">Агентов в команде</div>
        </div>
        <div className="bg-g-bg2 rounded-xl p-4 border border-g-border">
          <div className="text-2xl font-bold text-g-text">{agents.reduce((s, a) => s + a.toolCount, 0)}</div>
          <div className="text-xs text-g-text3 mt-1">Инструментов</div>
        </div>
        <div className="bg-g-bg2 rounded-xl p-4 border border-g-border">
          <div className="text-2xl font-bold text-emerald-400">{feed.length}</div>
          <div className="text-xs text-g-text3 mt-1">Сообщений в ленте</div>
        </div>
      </div>
    </div>
  );
}
