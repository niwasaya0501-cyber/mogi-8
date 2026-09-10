import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI売上ダッシュボード",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-zinc-50">{children}</body>
    </html>
  );
}
