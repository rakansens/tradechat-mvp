/**
 * components/chat/window/hooks/useChatWindowStores.ts
 * 作成: ChatWindowで使用するストアとセレクターを集約したカスタムフック
 * 更新: 2025-05-20 - useChatStoreをuseRootStoreに置き換え
 * 更新: 2025-05-15 - useEntryStoreをuseRootStoreに置き換え
 * 更新: 2025-06-29 - アクティブ会話単位のセレクターを使用するよう変更
 * 更新: 2025-06-29 - 接続状態情報を取得するように変更
 */

import { useRootStore } from "@/store";
import {
  selectActiveIsSearching,
  selectActiveMessagesWithStreaming,
  selectPendingEntry,
  selectActiveStreamingMessage,
  selectConversationConnection
} from "@/store";
import { ExtendedMessage } from "@/types/chat";
import { OpenEntry } from "@/types/entry";

/**
 * ChatWindowコンポーネントで使用する全てのストアデータを取得するフック
 * @returns ChatWindowに必要なストアデータとセレクター
 */
export default function useChatWindowStores() {
  // メモ化されたセレクターを使用してデータを取得
  const messages = useRootStore(selectActiveMessagesWithStreaming);
  const isSearching = useRootStore(selectActiveIsSearching);
  const pendingEntry = useRootStore(selectPendingEntry);
  const streamingMessage = useRootStore(selectActiveStreamingMessage);
  const connection = useRootStore(selectConversationConnection);

  return {
    // チャットデータ
    messages,
    isSearching,
    streamingMessage,
    connection,
    
    // エントリー（トレード）データ
    pendingEntry,
  };
} 