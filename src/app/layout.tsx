import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "塾スタートアップ | チームダッシュボード",
  description: "総合型選抜オンライン塾の創業チーム向けビジョン・タスク共有ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full bg-gray-50">{children}</body>
    </html>
  );
}
