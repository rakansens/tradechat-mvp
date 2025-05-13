// app/(chat)/page.tsx
// チャットのルートページ（リダイレクト用）
// 作成日: 2025/5/20

import { Loader2 } from 'lucide-react';

export default function ChatPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>会話を読み込んでいます...</p>
      </div>
    </div>
  );
} 