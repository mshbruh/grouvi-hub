import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        g: {
          bg: "#111111",
          bg2: "#161616",
          panel: "#161616",
          panel2: "#1a1a1a",
          border: "#222222",
          border2: "#2a2a2a",
          border3: "#333333",
          text: "#e5e5e5",
          text2: "#999999",
          text3: "#666666",
          accent: "#F4EDE4",
          accent2: "#e8e1d8",
          blue: "#3b82f6",
          green: "#22c55e",
          red: "#ef4444",
          code: "#f59e0b",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Inter",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "SF Mono",
          "ui-monospace",
          "Cascadia Code",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        g: "8px",
        g2: "10px",
      },
    },
  },
  plugins: [],
};
export default config;
