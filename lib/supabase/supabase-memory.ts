// lib/supabase/supabase-memory.ts
// Supabaseメモリデータ関連ユーティリティ関数
// 作成日: 2025/5/31
// 更新日: 2025/6/1 - OpenAI APIを使用したembedding生成機能を追加

import { supabase } from './supabase';
import { Tables, TablesInsert, TablesUpdate } from '@/types/network/supabase';
import { generateEmbedding } from '@/lib/openai';

// メモリ関連の型定義
type Memory = Tables<'memories'>;
type MemoryInsert = TablesInsert<'memories'>;
type MemoryUpdate = TablesUpdate<'memories'>;

// Supabaseのカスタム関数の戻り値型を定義
interface MemoryWithSimilarity extends Memory {
  similarity: number;
}

/**
 * メモリをSupabaseに保存
 * @param userId ユーザーID
 * @param content メモリ内容
 * @param externalId 外部APIのメモリID (Mem0API)
 * @param metadata メタデータ
 * @returns 保存されたメモリ
 */
export const createMemory = async (
  userId: string,
  content: string,
  externalId?: string,
  metadata: Record<string, any> = {}
): Promise<Memory> => {
  // テキストからembeddingを生成
  let embedding = null;
  try {
    embedding = await generateEmbedding(content);
  } catch (error) {
    console.error('Embedding生成エラー:', error);
    // embedding生成に失敗してもメモリ自体は保存する
  }
  
  const memoryData: MemoryInsert = {
    user_id: userId,
    content,
    external_id: externalId || null,
    metadata,
    embedding: embedding as any, // 型キャスト
  };

  const { data, error } = await supabase
    .from('memories')
    .insert([memoryData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * メモリを更新
 * @param memoryId メモリID
 * @param updates 更新内容
 * @returns 更新されたメモリ
 */
export const updateMemory = async (
  memoryId: string,
  updates: Partial<Omit<Memory, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Memory> => {
  // content更新の場合は新しいembeddingを生成
  let embedding = undefined;
  if (updates.content) {
    try {
      embedding = await generateEmbedding(updates.content);
      if (embedding) {
        (updates as any).embedding = embedding;
      }
    } catch (error) {
      console.error('Embedding生成エラー:', error);
      // embedding生成に失敗してもメモリ自体は更新する
    }
  }

  const { data, error } = await supabase
    .from('memories')
    .update(updates)
    .eq('id', memoryId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * メモリを削除
 * @param memoryId メモリID
 * @returns 削除結果
 */
export const deleteMemory = async (memoryId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('memories')
    .delete()
    .eq('id', memoryId);

  if (error) {
    throw error;
  }

  return true;
};

/**
 * ユーザーのメモリ一覧を取得
 * @param userId ユーザーID
 * @param limit 取得件数
 * @param offset オフセット
 * @returns メモリ一覧
 */
export const getUserMemories = async (
  userId: string,
  limit = 50,
  offset = 0
): Promise<Memory[]> => {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * テキストベースでメモリを検索
 * @param userId ユーザーID
 * @param searchText 検索テキスト
 * @param limit 取得件数
 * @returns 検索結果
 */
export const searchMemoriesByText = async (
  userId: string,
  searchText: string,
  limit = 10
): Promise<Memory[]> => {
  // FTS（全文検索）を使用した基本的な検索
  // 注: 実際の実装ではより洗練された検索ロジックが必要かもしれません
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .textSearch('content', searchText)
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * ベクトル類似度検索でメモリを検索
 * @param userId ユーザーID
 * @param queryText 検索クエリ
 * @param limit 取得件数
 * @returns 検索結果
 */
export const searchMemoriesBySimilarity = async (
  userId: string,
  queryText: string,
  limit = 5
): Promise<Memory[]> => {
  // クエリからembeddingを生成
  let embedding;
  try {
    embedding = await generateEmbedding(queryText);
  } catch (error) {
    console.error('Embedding生成エラー:', error);
    // embeddingが生成できない場合はテキスト検索にフォールバック
    return searchMemoriesByText(userId, queryText, limit);
  }

  if (!embedding) {
    // embeddingが生成できない場合はテキスト検索にフォールバック
    return searchMemoriesByText(userId, queryText, limit);
  }

  try {
    // Supabaseのpgvector拡張を使用した類似度検索
    // embedding <-> query_embedding の距離が小さい順（類似度が高い順）に取得
    // 以下の行はSupabase拡張のrpcメソッドを使用
    // @ts-ignore - 型エラーを無視（Supabaseの型定義が完全ではないため）
    const { data, error } = await supabase.rpc('match_memories', {
      query_embedding: embedding,
      match_threshold: 0.7, // 類似度閾値
      match_count: limit,
      user_id_input: userId
    });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('ベクトル検索エラー:', error);
    // エラー時はテキスト検索にフォールバック
    return searchMemoriesByText(userId, queryText, limit);
  }
};

/**
 * 外部IDでメモリを取得
 * @param externalId 外部ID
 * @returns メモリまたはnull
 */
export const getMemoryByExternalId = async (
  externalId: string
): Promise<Memory | null> => {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('external_id', externalId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * 同期フラグを更新
 * @param memoryId メモリID
 * @param isSynced 同期済みかどうか
 * @returns 更新されたメモリ
 */
export const updateSyncStatus = async (
  memoryId: string,
  isSynced: boolean
): Promise<Memory> => {
  const { data, error } = await supabase
    .from('memories')
    .update({ is_synced: isSynced })
    .eq('id', memoryId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * 未同期のメモリを取得
 * @param userId ユーザーID
 * @param limit 取得件数
 * @returns 未同期メモリ一覧
 */
export const getUnsyncedMemories = async (
  userId: string,
  limit = 50
): Promise<Memory[]> => {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .eq('is_synced', false)
    .limit(limit);

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * vector_match関数を作成するSQLファンクション
 * 注: このSQLはマイグレーションファイルに含める必要があります
 */
export const createMatchMemoriesFunctionSQL = `
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  user_id_input UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  content TEXT,
  metadata JSONB,
  external_id TEXT,
  is_synced BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.user_id,
    m.content,
    m.metadata,
    m.external_id,
    m.is_synced,
    m.created_at,
    m.updated_at,
    1 - (m.embedding <=> query_embedding) as similarity
  FROM memories m
  WHERE 
    m.user_id = user_id_input
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
`; 