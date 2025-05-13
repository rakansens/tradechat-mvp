"use client"

/**
 * components/chat/window/index.tsx
 * 作成: リファクタリング後のChatWindowコンポーネント
 * 役割: HooksとUIを結合し、元のChatWindowと同等の機能を提供
 */

import React, { forwardRef } from "react";
import type { TradeActionProps } from "@/types/common-interfaces";
import type { OpenEntry } from "@/types/entry";

// カスタムフック
import useChatWindowStores from "./hooks/useChatWindowStores";
import useScrollManager from "./hooks/useScrollManager";

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
    const { messages, isSearching, pendingEntry, streamingMessage } = useChatWindowStores();
    
    // スクロール管理フックを使用
    const { containerRef, showScrollButton, handleScroll, scrollToBottom } = useScrollManager();
    
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