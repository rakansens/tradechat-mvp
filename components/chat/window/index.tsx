"use client"

/**
 * components/chat/window/index.tsx
 * 作成: リファクタリング後のChatWindowコンポーネント
 * 役割: HooksとUIを結合し、元のChatWindowと同等の機能を提供
 * 更新: 2025-05-21 - マルチスレッド会話IDをサポート
 * 更新: 2025-06-25 - ConversationContextを使用するように変更
 * 更新: 2025-06-25 - useScrollManagerからuseAutoScrollに変更
 * 更新: 2025-06-29 - 接続状態情報をSearchingIndicatorに渡すように変更
 */

import React, { forwardRef, useEffect } from "react";
import type { TradeActionProps } from "@/types/common/interfaces";
import type { OpenEntry } from "@/types/entry";
import type { ConnectionInfo } from "@/types/chat/base";
import { useRootStore } from "@/store";

// カスタムフック
import useChatWindowStores from "./hooks/useChatWindowStores";
import useAutoScroll from "@/hooks/ui/useAutoScroll";
import { useChatInteraction } from "@/hooks/chat";
import { useConversation } from "@/contexts/ConversationContext";

// UIコンポーネント
import MessageListWrapper from "./ui/MessageListWrapper";
import { SearchingIndicator } from "./ui/SearchingIndicator";
import { ScrollDownButton } from "./ui/ScrollDownButton";

// シンプル化されたインターフェース
interface ChatWindowProps extends Pick<TradeActionProps, 'onExecuteEntry'> {
  ref?: React.Ref<HTMLDivElement>;
  isThinking?: boolean;
  editPendingEntry?: (entry: OpenEntry) => void;
  cancelPendingEntry?: () => void;
}

/**
 * チャットウィンドウコンポーネント
 * スクロール位置管理とメッセージ表示を行う
 */
const ChatWindow = forwardRef<HTMLDivElement, ChatWindowProps>(
  ({ 
    isThinking = false,
    onExecuteEntry, 
    editPendingEntry,
    cancelPendingEntry
  }, ref) => {
    // ストアから状態を取得
    const { messages, isSearching, pendingEntry, streamingMessage, connection } = useChatWindowStores();
    
    // スクロール管理フックを使用
    const { containerRef, showScrollButton, handleScroll, scrollToBottom } = useAutoScroll();
    
    // ConversationContextから会話IDを取得
    const { conversationId } = useConversation();
    
    // conversationIdが変更されたら会話内容を読み込む
    useEffect(() => {
      if (conversationId) {
        // 会話データを読み込む
        fetch(`/api/messages/${conversationId}`)
          .then(res => {
            if (!res.ok) throw new Error('会話を読み込めませんでした');
            return res.json();
          })
          .then(data => {
            // メッセージをストアに設定（既存のuseChatWindowStoresと結合）
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
            
            // メッセージを更新
            // 注: ここでuseChatWindowStoresのsetMessagesがない場合は、 
            // useRootStore.getState().setMessagesを直接使用することになる
            try {
              // ストアのセッター関数を使用
              useRootStore.getState().setMessages(formattedMessages);
            } catch (error) {
              console.error('Failed to update messages:', error);
            }
          })
          .catch(err => {
            console.error('Error loading conversation:', err);
          });
      }
    }, [conversationId]);
    
    return (
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto px-3 pb-0 relative" 
        style={{ scrollBehavior: 'smooth', height: '100%' }}
        onScroll={handleScroll}
      >
        {/* メッセージリスト */}
        <MessageListWrapper
          messages={messages}
          pendingEntry={pendingEntry || null}
          chatEndRef={ref as React.RefObject<HTMLDivElement>}
          executeEntry={onExecuteEntry}
          editPendingEntry={editPendingEntry}
          cancelPendingEntry={cancelPendingEntry}
        />
        
        {/* 状態インジケーター - ストリーミングメッセージがない場合のみ表示 */}
        {!streamingMessage && (
          <SearchingIndicator
            isSearching={isSearching}
            isThinking={isThinking}
            connection={connection}
          />
        )}
        
        {/* スクロールダウンボタン */}
        <ScrollDownButton 
          onClick={scrollToBottom} 
          isVisible={showScrollButton} 
        />
      </div>
    );
  }
);

ChatWindow.displayName = "ChatWindow";

export default ChatWindow; 