import React from "react";
import ReactDOM from "react-dom/client";
import NotesModule from "./components/modules/NotesModule";
import "./globals.css";

function NotesApp() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-g-bg, #111)",
      }}
    >
      {/* Header */}
      <header
        style={{
          height: 44,
          minHeight: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          borderBottom: "1px solid rgba(255,255,255,.06)",
          background: "rgba(17,17,17,.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        <a
          href="https://grouvi.online"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "rgba(255,255,255,.5)" }}
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "rgba(255,255,255,.85)",
              letterSpacing: "0.02em",
            }}
          >
            Grouvi
          </span>
        </a>
        <span
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,.35)",
            fontFamily: "monospace",
          }}
        >
          notes
        </span>
      </header>
      {/* Module */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <NotesModule />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NotesApp />
  </React.StrictMode>
);
