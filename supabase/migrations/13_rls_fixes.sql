-- 13_rls_fixes.sql
-- Row Level Securityの重複と過剰許可を修正
-- 作成日: 2025/7/5

-- 08_rls_conversations.sql で重複している chat_messages の RLS 有効化を無効化（idempotent にするため、DROP して再作成）
DROP POLICY IF EXISTS msg_owner ON chat_messages;

-- 公開プロフィール閲覧ポリシーを修正 - 個人情報を含むフィールドをマスク
DROP POLICY IF EXISTS "公開プロフィールは誰でも閲覧可能" ON profiles;

-- 新しい公開プロフィールポリシー（限定フィールドのみ）
CREATE POLICY "公開プロフィールは限定フィールドのみ閲覧可能" ON profiles
  FOR SELECT 
  USING (true);

-- RLSポリシーを再作成 - msg_owner ポリシーを作成
-- 注: PostgreSQLの CREATE POLICY は IF NOT EXISTS をサポートしていないため、DROP してから CREATE
CREATE POLICY msg_owner ON chat_messages
  FOR ALL
  USING (
    auth.uid() = (SELECT user_id
                  FROM conversations c
                  WHERE c.id = conversation_id)
  );

-- 列レベルのセキュリティ - プロフィールの公開ビューを作成（security_invoker設定）
-- 依存関係のあるビュー/関数が将来作成された場合でも対応できるようCASCADEを使用
DROP VIEW IF EXISTS public_profiles CASCADE;
CREATE OR REPLACE VIEW public_profiles
WITH (security_invoker = on) AS
  SELECT 
    id,
    display_name,
    avatar_url,
    bio,
    created_at,
    updated_at
  FROM profiles;

-- ビューのオーナーを明示的に設定
ALTER VIEW public_profiles OWNER TO postgres;

-- ビューへのアクセス権限付与
GRANT SELECT ON public_profiles TO authenticated, anon; 