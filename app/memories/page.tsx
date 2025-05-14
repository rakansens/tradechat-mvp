// app/memories/page.tsx
// メモリ管理ページ
// 作成日: 2025/5/31

import MemoryManager from "@/components/memory/MemoryManager";

export const metadata = {
  title: "メモリ管理 - TradeChatアプリ",
  description: "AIチャットと会話履歴の管理、メモリ管理を行います",
};

export default function MemoriesPage() {
  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">メモリ管理</h1>
      <MemoryManager />
    </div>
  );
} 