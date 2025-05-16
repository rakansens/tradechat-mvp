/**
 * types/memory.ts
 * 作成: 2025-06-27 - Memory関連の型定義
 */

/**
 * メモリの基本型定義
 */
export interface Memory {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
  external_id?: string | null;
  is_synced: boolean;
  user_id?: string;
  embedding?: number[] | null;
  score?: number; // 類似度スコア（ベクトル検索の結果）
}

/**
 * メモリ作成時の入力型定義
 */
export interface MemoryInput {
  content: string;
  metadata?: Record<string, any>;
  external_id?: string;
}

/**
 * メモリ更新時の入力型定義
 */
export interface MemoryUpdateInput {
  content?: string;
  metadata?: Record<string, any>;
  is_synced?: boolean;
}

/**
 * メモリ検索オプション型定義
 */
export interface MemorySearchOptions {
  query: string;
  conversationId?: string;
  limit?: number;
  offset?: number;
}

/**
 * メモリ検索結果型定義
 */
export interface MemorySearchResult {
  results: Memory[];
  total: number;
  query: string;
  method: 'similarity' | 'text'; // 検索方法（ベクトル検索 or テキスト検索）
} 