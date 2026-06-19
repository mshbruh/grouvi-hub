import React, { useState } from "react";
import { useAppState } from "./store";
import Header from "./Header";
import OfficeGrid from "./OfficeGrid";
import ChatPanel from "./ChatPanel";
import FeedPanel from "./FeedPanel";
import TaskModal from "./TaskModal";
import TaskView from "./TaskView";
import DuetKeysModule from "../components/modules/DuetKeysModule";

export default function App() {
  const state = useAppState();
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [feedExpanded, setFeedExpanded] = useState(false);

  if (state.loading) {
    return (
      <div className="h-screen bg-g-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-g-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-g-text2 text-sm">Загрузка офиса...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-g-bg flex flex-col overflow-hidden">
      <Header
        view={state.view}
        onHome={state.goHome}
        onNewTask={() => setShowTaskModal(true)}
        agentCount={state.agents.length}
        feedCount={state.feed.length}
        onToggleFeed={() => setFeedExpanded(!feedExpanded)}
        onDuetKeys={() => state.setView("duet-keys")}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main content */}
        <div className={`flex-1 overflow-hidden transition-all duration-300 ${feedExpanded ? "mr-80" : ""}`}>
          {state.view === "office" && (
            <OfficeGrid agents={state.agents} feed={state.feed} onSelectAgent={state.openChat} />
          )}
          {state.view === "chat" && state.selectedAgent && (
            <ChatPanel
              agent={state.agents.find((a) => a.id === state.selectedAgent)!}
              messages={state.chatHistories[state.selectedAgent] || []}
              onSendMessage={state.addChatMessage}
              onClear={() => state.clearChat(state.selectedAgent!)}
              onBack={state.goHome}
              feed={state.feed.filter((f) => f.agentId === state.selectedAgent)}
            />
          )}
          {state.view === "task" && <TaskView feed={state.feed} />}
          {state.view === "duet-keys" && (
            <div className="h-full overflow-hidden"><DuetKeysModule /></div>
          )}
        </div>

        {/* Feed sidebar */}
        <div
          className={`fixed right-0 top-12 bottom-0 w-80 bg-g-bg2 border-l border-g-border transform transition-transform duration-300 z-30 ${
            feedExpanded ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <FeedPanel messages={state.feed} agents={state.agents} onSelectAgent={state.openChat} />
        </div>
      </div>

      {showTaskModal && (
        <TaskModal
          onClose={() => setShowTaskModal(false)}
          onSubmit={() => {
            setShowTaskModal(false);
            state.setView("task");
          }}
        />
      )}
    </div>
  );
}
