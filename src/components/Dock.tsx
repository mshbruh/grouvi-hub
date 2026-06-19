import React from "react";

const dockItems = [
  {
    label: "AI Office",
    active: true,
    href: "https://ai.grouvi.online",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    label: "OmniRoute",
    active: true,
    href: "https://omniroute.grouvi.online",
    icon: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
  { label: "sep" },
  {
    label: "Почта",
    active: true,
    href: "https://temp.grouvi.online",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M22 7l-10 7L2 7" />
      </svg>
    ),
  },
  {
    label: "Карты",
    active: true,
    href: "https://cards.grouvi.online",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    label: "Заметки",
    active: true,
    href: "https://notes.grouvi.online",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 20h9" />
        <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
      </svg>
    ),
  },
  { label: "sep" },
  {
    label: "Grafana",
    active: true,
    href: "https://grafana.freelance-gid.online",
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M3 3v18h18" />
        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
      </svg>
    ),
  },
  {
    label: "AccessBot",
    active: false,
    href: "https://app.freelance-gid.online",
    icon: (
      <svg viewBox="0 0 24 24">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <line x1="12" y1="7" x2="12" y2="11" />
        <circle cx="9" cy="16" r="1" />
        <circle cx="15" cy="16" r="1" />
      </svg>
    ),
  },
];

export default function Dock() {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0.5 bg-g-bg/80 backdrop-blur-xl border border-g-border rounded-[14px] px-2.5 py-1.5">
      {dockItems.map((item, i) =>
        item.label === "sep" ? (
          <div key={i} className="w-px h-6 bg-g-border2 mx-1.5" />
        ) : (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-9 h-9 flex items-center justify-center rounded-[10px] cursor-pointer text-g-text3 hover:text-g-text hover:bg-white/[.06] hover:scale-110 hover:-translate-y-0.5 transition-all duration-200 [&_svg]:w-[18px] [&_svg]:h-[18px] [&_svg]:stroke-current [&_svg]:fill-none [&_svg]:stroke-[1.5] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round]"
            title={item.label}
          >
            {item.icon}
            {item.active && (
              <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-g-accent" />
            )}
          </a>
        )
      )}
    </div>
  );
}
