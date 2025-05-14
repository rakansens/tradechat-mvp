-- 11_vector_function.sql
-- ベクトル検索用のSQLファンクション
-- 作成日: 2025/5/31

-- pgvector拡張が存在しない場合はインストール
CREATE EXTENSION IF NOT EXISTS vector;

-- ベクトル類似度検索用のSQLファンクション
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