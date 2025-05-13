/**
 * components/chat/window/hooks/useChatWindowStores.ts
 * 作成: ChatWindowで使用するストアとセレクターを集約したカスタムフック
 * 更新: 2025-05-20 - useChatStoreをuseRootStoreに置き換え
 * 更新: 2025-05-15 - useEntryStoreをuseRootStoreに置き換え
 */

import { useRootStore } from "@/store";
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
  const messages = useRootStore(selectMessagesWithStreaming);
  const isSearching = useRootStore(selectIsSearching);
  const pendingEntry = useRootStore(selectPendingEntry);
  const streamingMessage = useRootStore(selectStreamingMessage);

  return {
    // チャットデータ
    messages,
    isSearching,
    streamingMessage,
    
    // エントリー（トレード）データ
    pendingEntry,
  };
} 