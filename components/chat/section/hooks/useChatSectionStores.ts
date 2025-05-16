/**
 * components/chat/section/hooks/useChatSectionStores.ts
 * チャットセクションで使用するストア関連の状態とアクションを集約するフック
 * 
 * 変更履歴:
 * - 2023-06-10: ChatSection.tsxのリファクタリングに伴い作成
 * - 2025-05-20: useChatStoreをuseRootStoreに置き換え
 * - 2025-05-13: 古いuseChatStore参照を完全に削除
 * - 2025-05-15: useEntryStoreをuseRootStoreに置き換え
 * - 2025-06-29: アクティブ会話単位のセレクターを使用するよう変更
 * - 2025-06-29: 接続状態情報を取得するように変更
 */

import { 
  useRootStore,
  // メモ化されたセレクター
  selectActiveMessages,
  selectActiveIsSearching,
  selectActiveInput,
  selectConversationConnection,
  selectPendingEntry,
  selectHasPendingEntry
} from "@/store";

/**
 * チャットセクションで使用するストア関連の状態とアクションを集約するフック
 * 
 * チャットとエントリーストアから必要なデータとアクションを取得し、
 * 統一されたインターフェースで提供します。
 * 
 * @returns チャットセクションで使用する状態とアクション
 */
export const useChatSectionStores = () => {
  // アクティブ会話のデータを取得
  const messages = useRootStore(selectActiveMessages);
  const isLoading = useRootStore(selectActiveIsSearching);
  const input = useRootStore(selectActiveInput);
  const connection = useRootStore(selectConversationConnection);
  
  // RootStoreからアクションを直接取得
  const rootStore = useRootStore();
  const setInput = rootStore.setInput;
  const sendMessage = rootStore.sendMessage;
  
  // エントリー関連の状態もRootStoreから取得
  const pendingEntry = useRootStore(selectPendingEntry);
  const hasPendingEntry = useRootStore(selectHasPendingEntry);
  
  return {
    // チャット関連
    chat: {
      messages,
      isLoading,
      input,
      connection, // 接続状態情報を追加
      setInput,
      sendMessage,
    },
    
    // エントリー関連
    entry: {
      pendingEntry,
      hasPendingEntry,
    }
  };
};

export default useChatSectionStores; 