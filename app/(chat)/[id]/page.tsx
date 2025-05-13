'use client'

// app/(chat)/[id]/page.tsx
// 指定された会話IDのチャットページ
// 作成日: 2025/5/20

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import ChatWindow from '@/components/chat/window';
import { useRootStore } from '@/store';
import { useChatInteraction } from '@/hooks/chat';

export default function ConversationPage({ params }: { params: { id: string } }) {
  const { id: conversationId } = params;
  const setMessages = useRootStore(state => state.setMessages);
  const setIsSearching = useRootStore(state => state.setIsSearching);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  
  const router = useRouter();

  // 会話データを読み込む
  useEffect(() => {
    if (!conversationId) return;

    setIsLoading(true);
    setError(null);

    fetch(`/api/messages/${conversationId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('会話を読み込めませんでした');
        }
        return res.json();
      })
      .then(data => {
        // 会話データを設定
        setConversation(data.conversation);
        
        // メッセージをストアに設定
        const formattedMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          ...(msg.is_proposal && { isProposal: true }),
          ...(msg.proposal_type && { proposalType: msg.proposal_type }),
          ...(msg.price && { price: msg.price }),
          ...(msg.take_profit && { takeProfit: msg.take_profit }),
          ...(msg.stop_loss && { stopLoss: msg.stop_loss }),
          ...(msg.chat_images?.image_data && { 
            imageData: msg.chat_images.image_data,
            imageCaption: msg.chat_images.image_caption || 'Image' 
          }),
        }));
        
        setMessages(formattedMessages);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error loading conversation:', err);
        setError(err.message);
        setIsLoading(false);
      });
  }, [conversationId, setMessages]);

  // オプション: カスタムフックで拡張可能
  const { input, handleInputChange, handleSubmit, isSearching } = useChatInteraction({
    conversationId,
    system_prompt: conversation?.system_prompt,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>会話を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-destructive">
          <p>エラー: {error}</p>
          <button 
            onClick={() => router.push('/chat')}
            className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground"
          >
            会話一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* 会話タイトル */}
      <div className="flex h-14 items-center border-b px-4">
        <h1 className="text-lg font-medium">{conversation?.title || '会話'}</h1>
      </div>

      {/* チャットウィンドウ */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow isThinking={isSearching} />
      </div>

      {/* 入力フォーム */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="メッセージを入力..."
            className="flex-1 rounded-md border border-input bg-background px-3 py-2"
          />
          <button
            type="submit"
            disabled={isSearching || !input.trim()}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
          >
            送信
          </button>
        </form>
      </div>
    </div>
  );
} 