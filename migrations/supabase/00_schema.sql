-- 00_schema.sql
-- スキーマ定義ファイル
-- 作成日: 2025/5/7

-- スキーマの作成
CREATE SCHEMA IF NOT EXISTS public;

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- コメント
COMMENT ON SCHEMA public IS 'tradechat-mvpアプリケーションのデータを格納するスキーマ';