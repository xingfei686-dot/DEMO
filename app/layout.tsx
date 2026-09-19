import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wander AI — 让旅行更像你",
  description: "用 AI 发现目的地，生成属于你的个性化旅行计划。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}

