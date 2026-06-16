import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grouvi — Командный центр AI",
  description:
    "Единый доступ к нейросетям. API, агенты, сессии, автоматизация — всё в одном месте.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="font-sans">{children}</body>
    </html>
  );
}
