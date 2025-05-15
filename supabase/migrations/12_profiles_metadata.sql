-- 12_profiles_metadata.sql
-- profiles テーブルに metadata JSONB カラムを追加
-- 作成日: 2025/7/5
 
-- profiles テーブルに metadata カラムを追加
ALTER TABLE profiles
  ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb; 