-- 15_idempotent_updates.sql
-- RLSポリシーの冪等化とコメントの重複修正
-- 作成日: 2025/7/5

-- usersテーブルのRLSポリシーを冪等化
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_self" ON users;
DROP POLICY IF EXISTS "users_update_self" ON users;

-- usersテーブルのRLSポリシー (シンプル化)
-- 読み取り: 自分の行だけ
CREATE POLICY "users_select_own"
ON users
FOR SELECT
USING (id = auth.uid());

-- 追加: 自分の行だけ
CREATE POLICY "users_insert_self"
ON users
FOR INSERT
WITH CHECK (id = auth.uid());

-- 更新: 自分の行だけ
CREATE POLICY "users_update_self"
ON users
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- profilesテーブルのRLSポリシーを冪等化
DROP POLICY IF EXISTS "ユーザーは自分のプロフィールを管理可能" ON profiles;
DROP POLICY IF EXISTS "管理者はすべてのプロフィールにアクセス可能" ON profiles;

-- 自分のプロフィールは読み書き可
CREATE POLICY "ユーザーは自分のプロフィールを管理可能"
ON profiles
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 既存のコメントが重複している場合は修正
COMMENT ON TABLE profiles IS 'ユーザープロフィール情報';
COMMENT ON TABLE users IS 'ユーザー認証情報';
COMMENT ON TABLE entries IS '取引エントリー';
COMMENT ON TABLE conversations IS '会話履歴';
COMMENT ON TABLE chat_messages IS 'チャットメッセージ';

-- ビューへの権限設定（冪等化）
GRANT SELECT ON public_profiles TO authenticated, anon; 