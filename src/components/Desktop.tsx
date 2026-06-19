import React, { useState, useCallback, useMemo } from "react";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";
import TopBar from "./TopBar";
import Dock from "./Dock";
import Window from "./Window";
import ModuleSelector from "./ModuleSelector";
import { MODULE_REGISTRY, ModuleDef } from "@/lib/window-registry";

import MailModule from "./modules/MailModule";
import AiChatModule from "./modules/AiChatModule";
import CardModule from "./modules/CardModule";
import NotesModule from "./modules/NotesModule";
import AgentModule from "./modules/AgentModule";
import DuetKeysModule from "./modules/DuetKeysModule";

const ResponsiveGridLayout = WidthProvider(Responsive);

const MODULE_MAP: Record<string, React.FC> = {
  mail: MailModule,
  "ai-chat": AiChatModule,
  "cards": CardModule,
  "notes": NotesModule,
  "agent": AgentModule,
  "duet-keys": DuetKeysModule,
};

interface WindowState {
  uid: string;
  moduleId: string | null;
  title: string;
  badge: string;
}

let windowCounter = 0;

export default function Desktop() {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({
    lg: [],
    md: [],
    sm: [],
  });

  const usedModules = useMemo(
    () =>
      windows.filter((w) => w.moduleId).map((w) => w.moduleId as string),
    [windows]
  );

  const addWindow = useCallback(() => {
    windowCounter++;
    const uid = `win_${windowCounter}_${Date.now()}`;

    setWindows((prev) => [
      ...prev,
      { uid, moduleId: null, title: "новое окно", badge: "setup" },
    ]);

    setLayouts((prev) => {
      const lgLayout = prev.lg || [];
      const maxY = lgLayout.reduce((max, l) => Math.max(max, l.y + l.h), 0);
      const col = (windowCounter % 2) * 6;
      return {
        ...prev,
        lg: [
          ...lgLayout,
          { i: uid, x: col, y: maxY, w: 5, h: 6, minW: 3, minH: 4 },
        ],
      };
    });
  }, []);

  const closeWindow = useCallback((uid: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.uid === uid ? { ...w, badge: "closing" } : w
      )
    );
    setTimeout(() => {
      setWindows((prev) => prev.filter((w) => w.uid !== uid));
      setLayouts((prev) => ({
        ...prev,
        lg: (prev.lg || []).filter((l) => l.i !== uid),
      }));
    }, 250);
  }, []);

  const selectModule = useCallback((uid: string, mod: ModuleDef) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.uid === uid
          ? {
              ...w,
              moduleId: mod.id,
              title: mod.title.toLowerCase(),
              badge: "active",
            }
          : w
      )
    );
    setLayouts((prev) => ({
      ...prev,
      lg: (prev.lg || []).map((l) =>
        l.i === uid ? { ...l, w: 6, h: 7 } : l
      ),
    }));
  }, []);

  const onLayoutChange = useCallback(
    (
      _currentLayout: Layout[],
      allLayouts: { [key: string]: Layout[] }
    ) => {
      setLayouts(allLayouts);
    },
    []
  );

  return (
    <div className="desktop-bg min-h-screen relative select-none">
      {/* Subtle dot grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Warm glow */}
      <div className="fixed top-[15%] left-[25%] w-[500px] h-[500px] rounded-full bg-g-accent blur-[200px] opacity-[.03] pointer-events-none z-0" />

      <TopBar onAddWindow={addWindow} windowCount={windows.length} />

      {/* Content area */}
      <div className="pt-12 pb-20 px-3 relative z-10">
        {windows.length === 0 ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center justify-center min-h-[70vh] select-none">
            <div className="empty-hint ic-xl text-g-text3/30 mb-4">
              <svg viewBox="0 0 24 24">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <div className="text-sm text-g-text3 mb-1">
              Рабочий стол пуст
            </div>
            <div className="text-[12px] text-g-text3/60 mb-6">
              Нажмите «+ Окно» чтобы добавить модуль
            </div>
            <button onClick={addWindow} className="btn-primary">
              <span className="ic-sm">
                <svg viewBox="0 0 24 24">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
              Создать окно
            </button>
          </div>
        ) : (
          /* ── Grid layout ── */
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 768, sm: 480 }}
            cols={{ lg: 12, md: 6, sm: 1 }}
            rowHeight={60}
            margin={[10, 10]}
            containerPadding={[6, 6]}
            isResizable={true}
            isDraggable={true}
            draggableHandle=".window-drag-handle"
            compactType="vertical"
            preventCollision={false}
            onLayoutChange={onLayoutChange}
            useCSSTransforms={true}
          >
            {windows.map((win) => {
              const Mod = win.moduleId ? MODULE_MAP[win.moduleId] : null;
              return (
                <div key={win.uid}>
                  <Window
                    title={win.title}
                    badge={
                      win.badge === "closing" ? undefined : win.badge
                    }
                    onClose={() => closeWindow(win.uid)}
                    closing={win.badge === "closing"}
                  >
                    {Mod ? (
                      <Mod />
                    ) : (
                      <ModuleSelector
                        onSelect={(mod) => selectModule(win.uid, mod)}
                        usedModules={usedModules}
                      />
                    )}
                  </Window>
                </div>
              );
            })}
          </ResponsiveGridLayout>
        )}
      </div>

      <Dock />
    </div>
  );
}
