"use client"

/**
 * components/chat/window/ui/MessageListWrapper.tsx
 * 作成: MessageListにpropsを渡すラッパーコンポーネント
 */

import React, { memo } from "react";
import { MessageList } from "../../VirtualMessageList";
import type { ExtendedMessage } from "@/types/chat";
import type { OpenEntry } from "@/types/entry";
import type { TradeActionProps } from "@/types/common-interfaces";

interface MessageListWrapperProps {
  messages: ExtendedMessage[];
  pendingEntry: OpenEntry | null;
  chatEndRef: React.RefObject<HTMLDivElement>;
  executeEntry?: TradeActionProps['onExecuteEntry'];
  editPendingEntry?: (entry: OpenEntry) => void;
  cancelPendingEntry?: () => void;
}

/**
 * MessageListコンポーネントのラッパー
 * キャッシュとメモ化のために分離し、再レンダリング最適化
 */
const MessageListWrapper = memo(function MessageListWrapper({
  messages,
  pendingEntry,
  chatEndRef,
  executeEntry,
  editPendingEntry,
  cancelPendingEntry
}: MessageListWrapperProps) {
  return (
    <MessageList
      messages={messages}
      pendingEntry={pendingEntry}
      chatEndRef={chatEndRef}
      executeEntry={executeEntry}
      editPendingEntry={editPendingEntry}
      cancelPendingEntry={cancelPendingEntry}
    />
  );
});

export default MessageListWrapper; 