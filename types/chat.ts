/**
 * @deprecated このファイルはT-4フェーズで非推奨となりました。代わりに types/chat/base.ts を使用してください。
 * 後方互換性のために保持されていますが、今後は types/chat からインポートすることを推奨します。
 */

// types/chat.ts
// 作成: チャット関連の型定義
// 更新: 2025-06-29 - ConnectionInfo型を追加

import type { Message } from "ai";
import type { ConnectionStatus } from "@/store/chat/state";

/**
 * リアルタイム接続情報の型
 */
export interface ConnectionInfo {
  status: ConnectionStatus;
  error: string | null;
}

/**
 * トレード提案の種類
 */
export type ProposalType = "buy" | "sell";

/**
 * 拡張メッセージ型 - AIからのトレード提案などの追加プロパティを含む
 */
export interface ExtendedMessage extends Message {
  isProposal?: boolean;      // トレード提案かどうか
  proposalType?: ProposalType; // 提案の種類（買い/売り）
  price?: number;            // 提案価格
  takeProfit?: number;       // 提案利確価格
  stopLoss?: number;         // 提案損切り価格
  imageData?: string;        // Base64エンコードされた画像データ
  imageCaption?: string;     // 画像の説明
  imageId?: string;          // 画像のID（サーバー側で保存された画像を参照するためのID）
  isStreaming?: boolean;     // ストリーミング中のメッセージかどうか
}

/**
 * チャットの状態型
 */
export interface ChatState {
  // 状態
  messages: ExtendedMessage[];
  isSearching: boolean;
  input: string;

  // アクション
  setMessages: (messages: ExtendedMessage[]) => void;
  addMessage: (message: ExtendedMessage) => void;
  setIsSearching: (isSearching: boolean) => void;
  handleEntryPointQuery: () => void;
  handleNewsQuery: () => void;
  handleAIProposalQuery: () => void;
  
  // 追加アクション
  setInput: (input: string) => void;
  sendMessage: (message: string) => void;
  clearMessages: () => void;
  updateMessage: (id: string, updatedMessage: Partial<ExtendedMessage>) => void;
  deleteMessage: (id: string) => void;
}

/**
 * チャットUIの設定オプション
 */
export interface ChatUIOptions {
  showTimestamp?: boolean;   // タイムスタンプを表示するか
  enableAutoScroll?: boolean; // 新しいメッセージが来たときに自動スクロールするか
  messageLayout?: "default" | "compact" | "expanded"; // メッセージのレイアウトスタイル
}
