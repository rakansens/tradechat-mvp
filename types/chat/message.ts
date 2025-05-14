/**
 * チャットメッセージのロール型定義
 * 
 * このファイルはチャットメッセージのロールに関連する型定義を提供します。
 * MASTRAエージェントとの型互換性を確保するために作成されました。
 */

/**
 * メッセージロールの型定義
 * 
 * - user: ユーザーからのメッセージ
 * - assistant: AIアシスタントからの応答
 * - system: AIの振る舞いを定義するシステム指示
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * チャットメッセージの基本構造
 */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/**
 * データベースに保存されたチャットメッセージ
 */
export interface DatabaseChatMessage {
  id: string;
  user_id: string;
  conversation_id: string;
  role: string; // MessageRoleとしての型安全性はアプリケーション層で確保
  content: string;
  created_at: string;
  updated_at?: string;
  image_id?: string | null;
} 