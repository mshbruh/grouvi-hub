// ── Grouvi AI Markdown Renderer ──
import React, { useState } from "react";
import type { Artifact } from "./types";

// Extract code blocks as artifacts
export function extractArtifacts(text: string): Artifact[] {
  const artifacts: Artifact[] = [];
  const re = /```(\w*)\n([\s\S]*?)```/g;
  let m;
  let idx = 0;
  while ((m = re.exec(text)) !== null) {
    idx++;
    const lang = m[1] || "text";
    artifacts.push({
      id: `art-${Date.now()}-${idx}`,
      type: "code",
      title: lang !== "text" ? `${lang} snippet #${idx}` : `Code #${idx}`,
      language: lang,
      content: m[2].trim(),
    });
  }
  return artifacts;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="absolute top-2 right-2 px-2 py-1 text-xs rounded bg-[#333] hover:bg-[#444] text-[#aaa] hover:text-white transition-colors"
    >
      {copied ? "✓" : "Copy"}
    </button>
  );
}

function CodeBlock({ lang, code, onArtifact }: { lang: string; code: string; onArtifact?: (a: Artifact) => void }) {
  return (
    <div className="relative group my-3 rounded-lg overflow-hidden border border-[#2a2a2a]">
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1a1a2e] text-[#888] text-xs">
        <span className="font-mono">{lang || "code"}</span>
        <div className="flex gap-2">
          {onArtifact && (
            <button
              onClick={() =>
                onArtifact({
                  id: `art-${Date.now()}`,
                  type: "code",
                  title: `${lang || "code"} snippet`,
                  language: lang,
                  content: code,
                })
              }
              className="hover:text-white transition-colors"
            >
              ↗ Open
            </button>
          )}
        </div>
      </div>
      <div className="relative">
        <pre className="p-4 overflow-x-auto bg-[#0d0d1a] text-[#d4d4d4] text-sm leading-relaxed font-['JetBrains_Mono']">
          <code>{code}</code>
        </pre>
        <CopyBtn text={code} />
      </div>
    </div>
  );
}

// Simple inline markdown: bold, italic, code, links
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const re = /(\*\*(.+?)\*\*|__(.+?)__|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let m;
  let key = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));

    if (m[2] || m[3]) {
      parts.push(<strong key={key++} className="font-semibold text-white">{m[2] || m[3]}</strong>);
    } else if (m[4]) {
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded bg-[#1e1e2e] text-[#e879f9] text-[0.85em] font-['JetBrains_Mono']">
          {m[4]}
        </code>
      );
    } else if (m[5] && m[6]) {
      parts.push(
        <a key={key++} href={m[6]} target="_blank" rel="noopener" className="text-[#F4EDE4] underline underline-offset-2 hover:text-white">
          {m[5]}
        </a>
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

interface MdProps {
  text: string;
  onArtifact?: (a: Artifact) => void;
}

export function Markdown({ text, onArtifact }: MdProps) {
  // Split by code blocks
  const segments: React.ReactNode[] = [];
  const codeRe = /```(\w*)\n([\s\S]*?)```/g;
  let last = 0;
  let m;
  let key = 0;

  while ((m = codeRe.exec(text)) !== null) {
    if (m.index > last) {
      segments.push(<TextBlock key={key++} text={text.slice(last, m.index)} />);
    }
    segments.push(<CodeBlock key={key++} lang={m[1]} code={m[2].trim()} onArtifact={onArtifact} />);
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    segments.push(<TextBlock key={key++} text={text.slice(last)} />);
  }

  return <div className="markdown-content">{segments}</div>;
}

function TextBlock({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listOrdered = false;
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    const Tag = listOrdered ? "ol" : "ul";
    elements.push(
      <Tag key={key++} className={`my-2 pl-6 ${listOrdered ? "list-decimal" : "list-disc"} text-[#ccc]`}>
        {listItems.map((li, i) => (
          <li key={i} className="my-0.5">{renderInline(li)}</li>
        ))}
      </Tag>
    );
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Headers
    const hMatch = trimmed.match(/^(#{1,3})\s+(.+)/);
    if (hMatch) {
      flushList();
      const level = hMatch[1].length;
      const cls = level === 1 ? "text-xl font-bold text-white mt-4 mb-2" : level === 2 ? "text-lg font-semibold text-white mt-3 mb-1.5" : "text-base font-medium text-white mt-2 mb-1";
      elements.push(<div key={key++} className={cls}>{renderInline(hMatch[2])}</div>);
      continue;
    }

    // Unordered list
    if (/^[-*•]\s+/.test(trimmed)) {
      if (listItems.length > 0 && listOrdered) flushList();
      listOrdered = false;
      listItems.push(trimmed.replace(/^[-*•]\s+/, ""));
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      if (listItems.length > 0 && !listOrdered) flushList();
      listOrdered = true;
      listItems.push(trimmed.replace(/^\d+\.\s+/, ""));
      continue;
    }

    flushList();

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(<hr key={key++} className="my-4 border-[#2a2a2a]" />);
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote key={key++} className="my-2 pl-4 border-l-2 border-[#F4EDE4] text-[#bbb] italic">
          {renderInline(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Empty line
    if (!trimmed) {
      elements.push(<div key={key++} className="h-2" />);
      continue;
    }

    // Regular paragraph
    elements.push(<p key={key++} className="my-1 leading-relaxed">{renderInline(trimmed)}</p>);
  }

  flushList();
  return <>{elements}</>;
}
