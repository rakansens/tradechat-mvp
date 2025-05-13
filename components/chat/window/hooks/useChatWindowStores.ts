/**
 * components/chat/window/hooks/useChatWindowStores.ts
 * 作成: ChatWindowで使用するストアとセレクターを集約したカスタムフック
 */

import { useChatStore, useEntryStore } from "@/store";
import {
  selectIsSearching,
  selectMessagesWithStreaming,
  selectPendingEntry,
  selectStreamingMessage
} from "@/store";
import { ExtendedMessage } from "@/types/chat";
import { OpenEntry } from "@/types/entry";

/**
 * ChatWindowコンポーネントで使用する全てのストアデータを取得するフック
 * @returns ChatWindowに必要なストアデータとセレクター
 */
export default function useChatWindowStores() {
  // メモ化されたセレクターを使用してデータを取得
  const messages = useChatStore(selectMessagesWithStreaming);
  const isSearching = useChatStore(selectIsSearching);
  const pendingEntry = useEntryStore(selectPendingEntry);
  const streamingMessage = useChatStore(selectStreamingMessage);

  return {
    // チャットデータ
    messages,
    isSearching,
    streamingMessage,
    
    // エントリー（トレード）データ
    pendingEntry,
  };
} 