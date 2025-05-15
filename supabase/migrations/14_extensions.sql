-- 14_extensions.sql
-- 将来的に使用する可能性のある拡張機能のインストール
-- 作成日: 2025/7/5

-- PostgreSQL 標準拡張
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID生成
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- トリグラムインデックス（テキスト検索）
CREATE EXTENSION IF NOT EXISTS "unaccent";       -- アクセント除去（検索向上）

-- JSON 関連拡張
CREATE EXTENSION IF NOT EXISTS "postgres_fdw";   -- 外部データラッパー

-- クエリ統計拡張
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- クエリパフォーマンス統計

-- コメント
COMMENT ON EXTENSION "uuid-ossp" IS 'UUID生成機能';
COMMENT ON EXTENSION "pg_trgm" IS 'テキスト類似度検索用トリグラム機能';
COMMENT ON EXTENSION "unaccent" IS 'アクセント除去による検索機能向上';
COMMENT ON EXTENSION "postgres_fdw" IS '外部データソースへのアクセス';
COMMENT ON EXTENSION "pg_stat_statements" IS 'クエリ実行統計情報の収集'; 