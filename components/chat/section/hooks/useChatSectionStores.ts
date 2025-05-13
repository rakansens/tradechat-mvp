/**
 * components/chat/section/hooks/useChatSectionStores.ts
 * チャットセクションで使用するストア関連の状態とアクションを集約するフック
 * 
 * 変更履歴:
 * - 2023-06-10: ChatSection.tsxのリファクタリングに伴い作成
 * - 2025-05-20: useChatStoreをuseRootStoreに置き換え
 * - 2025-05-13: 古いuseChatStore参照を完全に削除
 * - 2025-05-15: useEntryStoreをuseRootStoreに置き換え
 */

import { 
  useRootStore,
  // メモ化されたセレクター
  selectMessages, 
  selectIsSearching,
  selectInput,
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
  // ChatStoreは不要なため削除（RootStoreに統合）
  // const chatStore = useChatStore();
  
  // RootStoreから状態を取得
  const messages = useRootStore(selectMessages);
  const isLoading = useRootStore(selectIsSearching);
  const input = useRootStore(selectInput);
  
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