import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./ai.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        g: {
          bg: "#0f1117",
          bg2: "#161922",
          panel: "#161922",
          panel2: "#1c1f2e",
          border: "rgba(255, 255, 255, 0.06)",
          border2: "rgba(255, 255, 255, 0.1)",
          border3: "rgba(255, 255, 255, 0.15)",
          text: "#f0ebe3",
          text2: "#b5b0a8",
          text3: "#6b6860",
          accent: "#4ade80",
          accent2: "#22c55e",
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
