import { useState, useCallback, useEffect, useRef } from "react";
import type { Agent, FeedMessage, ViewMode, ChatMessage } from "./types";
import { fetchAgents, subscribeFeed, fetchFeedHistory } from "./api";

export function useAppState() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [feed, setFeed] = useState<FeedMessage[]>([]);
  const [view, setView] = useState<ViewMode>("office");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({});
  const [loading, setLoading] = useState(true);
  const feedUnsub = useRef<(() => void) | null>(null);

  // Load agents on mount
  useEffect(() => {
    fetchAgents()
      .then(setAgents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Subscribe to feed
  useEffect(() => {
    fetchFeedHistory().then((msgs) => setFeed(msgs)).catch(() => {});

    feedUnsub.current = subscribeFeed((msg) => {
      setFeed((prev) => {
        const next = [...prev, msg];
        return next.length > 200 ? next.slice(-100) : next;
      });
    });

    return () => feedUnsub.current?.();
  }, []);

  const openChat = useCallback((agentId: string) => {
    setSelectedAgent(agentId);
    setView("chat");
  }, []);

  const goHome = useCallback(() => {
    setView("office");
    setSelectedAgent(null);
  }, []);

  const addChatMessage = useCallback(
    (agentId: string, msg: ChatMessage) => {
      setChatHistories((prev) => ({
        ...prev,
        [agentId]: [...(prev[agentId] || []), msg],
      }));
    },
    []
  );

  const clearChat = useCallback((agentId: string) => {
    setChatHistories((prev) => ({ ...prev, [agentId]: [] }));
  }, []);

  return {
    agents,
    feed,
    view,
    setView,
    selectedAgent,
    setSelectedAgent,
    openChat,
    goHome,
    chatHistories,
    addChatMessage,
    clearChat,
    loading,
  };
}
