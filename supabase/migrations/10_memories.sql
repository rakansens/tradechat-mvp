-- 10_memories.sql
-- Mem0メモリ保存用テーブル作成ファイル
-- 作成日: 2025/5/31
-- 更新日: 2025/8/22 - vector拡張機能の自動インストールを追加

-- vector拡張機能のインストール
CREATE EXTENSION IF NOT EXISTS vector;

-- memoriesテーブル作成
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,                -- メモリコンテンツ
  embedding VECTOR(1536),              -- OpenAIのembeddingモデルに合わせた次元数
  metadata JSONB DEFAULT '{}'::jsonb,  -- メタデータ（タグ、カテゴリー、関連トピックなど）
  external_id TEXT,                    -- Mem0 API側のメモリID
  is_synced BOOLEAN DEFAULT TRUE,      -- 外部APIと同期済みかどうか
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_external_id ON memories(external_id);
COMMENT ON INDEX idx_memories_user_id IS 'ユーザーごとのメモリ検索を高速化';
COMMENT ON INDEX idx_memories_external_id IS 'Mem0 API IDによるメモリ検索を高速化';

-- 更新日時を自動的に更新するトリガー
CREATE TRIGGER update_memories_updated_at
BEFORE UPDATE ON memories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLSを有効化し、デフォルトで拒否設定にする
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のメモリのみアクセス可能
CREATE POLICY "ユーザーは自分のメモリのみアクセス可能" ON memories
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべてのメモリにアクセス可能
CREATE POLICY "管理者はすべてのメモリにアクセス可能" ON memories
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true)); 