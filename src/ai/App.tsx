// ── Grouvi AI — Main App ──
import React, { useState, useEffect, useCallback } from "react";
import type { Conversation, Artifact, AppSettings, ModelInfo } from "./types";
import { loadConversations, saveConversations, loadSettings, saveSettings, loadActiveId, saveActiveId, newConversation } from "./store";
import { fetchModels } from "./api";
import { Sidebar } from "./Sidebar";
import { Chat } from "./Chat";
import { Detail } from "./Detail";
import { Settings } from "./Settings";

export function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const c = loadConversations();
    return Array.isArray(c) ? c : [];
  });
  const [activeId, setActiveId] = useState<string | null>(() => loadActiveId());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const active = conversations.find((c) => c.id === activeId) || null;

  // Persist state
  useEffect(() => { saveConversations(conversations); }, [conversations]);
  useEffect(() => { saveActiveId(activeId); }, [activeId]);
  useEffect(() => { saveSettings(settings); }, [settings]);

  // Load models
  useEffect(() => {
    fetchModels(settings).then((m) => setModels(Array.isArray(m) ? m : []));
  }, [settings.apiUrl, settings.apiKey]);

  // Extract artifacts from active conversation
  useEffect(() => {
    if (active) {
      const allArtifacts: Artifact[] = [];
      const msgs = Array.isArray(active.messages) ? active.messages : [];
      msgs.forEach((m) => {
        if (Array.isArray(m.artifacts)) allArtifacts.push(...m.artifacts);
      });
      setArtifacts(allArtifacts);
    } else {
      setArtifacts([]);
    }
  }, [active?.messages.length, activeId]);

  const handleNew = useCallback(() => {
    const conv = newConversation(settings.model);
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
  }, [settings.model]);

  const handleSelect = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  }, [activeId]);

  const handleRename = useCallback((id: string, title: string) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: title.trim() || c.title } : c)));
  }, []);

  const handleUpdate = useCallback((conv: Conversation) => {
    setConversations((prev) => prev.map((c) => (c.id === conv.id ? conv : c)));
  }, []);

  const handleArtifact = useCallback((a: Artifact) => {
    setArtifacts((prev) => {
      if (prev.find((p) => p.id === a.id)) return prev;
      return [...prev, a];
    });
    if (!detailOpen) setDetailOpen(true);
  }, [detailOpen]);

  const handleSaveSettings = useCallback((s: AppSettings) => {
    setSettings(s);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") { e.preventDefault(); handleNew(); }
      if ((e.metaKey || e.ctrlKey) && e.key === ",") { e.preventDefault(); setSettingsOpen(true); }
      if (e.key === "Escape" && settingsOpen) setSettingsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNew, settingsOpen]);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#0a0a0a]">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
        onRename={handleRename}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <Chat
        conversation={active}
        settings={settings}
        onUpdate={handleUpdate}
        onArtifact={handleArtifact}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenDetail={() => setDetailOpen(!detailOpen)}
        onNewChat={handleNew}
        detailOpen={detailOpen}
      />

      <Detail
        artifacts={artifacts}
        settings={settings}
        models={models}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onClearArtifacts={() => setArtifacts([])}
      />

      <Settings
        settings={settings}
        models={models}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
