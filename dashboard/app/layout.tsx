import {DisplayPreferences} from '@/components/display-preferences';
import {TopicProvider} from '@/components/topic-provider';
import type { Metadata } from "next";
import "./globals.css";
import {AtlasTheme} from "@/components/atlas-theme";

export const metadata: Metadata = {
  title: "Skill Atlas",
  description: "Your local library for discovering, collecting, and running AI skills with Codex.",
  other: {
    "codex-preview": "development",
  },
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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased"><AtlasTheme><DisplayPreferences><TopicProvider>{children}</TopicProvider></DisplayPreferences></AtlasTheme></body>
    </html>
  );
}
