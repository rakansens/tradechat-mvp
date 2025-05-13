/**
 * components/chat/section/hooks/useChatSectionStores.ts
 * チャットセクションで使用するストア関連の状態とアクションを集約するフック
 * 
 * 変更履歴:
 * - 2023-06-10: ChatSection.tsxのリファクタリングに伴い作成
 */

import { 
  useChatStore, 
  useEntryStore,
  // メモ化されたセレクター
  selectMessages, 
  selectIsSearching,
  selectInput,
  selectSetInput,
  selectSendMessage,
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
  // チャットストアから状態とアクションを取得
  const messages = useChatStore(selectMessages);
  const isLoading = useChatStore(selectIsSearching);
  const input = useChatStore(selectInput);
  const setInput = useChatStore(selectSetInput);
  const sendMessage = useChatStore(selectSendMessage);
  
  // エントリーストアから状態を取得
  const pendingEntry = useEntryStore(selectPendingEntry);
  const hasPendingEntry = useEntryStore(selectHasPendingEntry);
  
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