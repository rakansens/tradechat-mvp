/**
 * Supabase関連モジュールのインデックスファイル
 * Supabase SDKのラッパーや関連機能を再エクスポート
 * 更新日: 2025/6/5 - 重複エクスポートを解消
 * 更新日: 2025/6/5 - 選択的エクスポートに変更して名前衝突を防止
 */

// クライアントとユーティリティ
export * from './supabase';
export * from './supabase-api';

// 機能別モジュールから選択的にエクスポート
// 認証関連
export * from './supabase-auth';

// バックテスト関連
export * from './supabase-backtest';

// キャッシュ関連
export * from './supabase-cache';

// チャット関連（会話関連機能を除く）
export {
  getChatMessages,
  getUserChatMessages,
  createChatMessage,
  updateChatMessage,
  deleteChatMessage,
  uploadChatImage,
  getChatImage,
  subscribeToChatMessages
} from './supabase-chat';

// 会話関連
export * from './supabase-conversations';

// エントリー関連
export * from './supabase-entry';

// メモリ関連
export * from './supabase-memory';

// ユーザー関係関連
export * from './supabase-relations';

// 設定関連
export * from './supabase-settings'; 