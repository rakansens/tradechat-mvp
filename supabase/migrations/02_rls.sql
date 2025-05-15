-- 02_rls.sql
-- RLSポリシー設定ファイル
-- 作成日: 2025/5/7
-- 更新日: 2025/8/22 - usersテーブルのRLSポリシーを簡素化して無限再帰を防止

-- RLSを有効化し、デフォルトで拒否設定にする
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE symbol_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE indicator_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtest_data ENABLE ROW LEVEL SECURITY;

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

-- profilesテーブルのRLSポリシー
-- 自分のプロフィールは読み書き可能
CREATE POLICY "ユーザーは自分のプロフィールを管理可能" ON profiles
  FOR ALL USING (auth.uid() = user_id);

-- 公開プロフィールは誰でも閲覧可能
CREATE POLICY "公開プロフィールは誰でも閲覧可能" ON profiles
  FOR SELECT USING (true);

-- 管理者はすべてのプロフィールにアクセス可能
CREATE POLICY "管理者はすべてのプロフィールにアクセス可能" ON profiles
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

-- chat_messagesテーブルのRLSポリシー
-- 自分のメッセージは読み書き可能
CREATE POLICY "ユーザーは自分のメッセージを管理可能" ON chat_messages
  FOR ALL USING (auth.uid() = user_id);

-- 公開メッセージは誰でも閲覧可能
CREATE POLICY "公開メッセージは誰でも閲覧可能" ON chat_messages
  FOR SELECT USING (is_public = true);

-- 管理者はすべてのメッセージにアクセス可能
CREATE POLICY "管理者はすべてのメッセージにアクセス可能" ON chat_messages
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

-- chat_imagesテーブルのRLSポリシー
-- 自分の画像は読み書き可能
CREATE POLICY "ユーザーは自分の画像を管理可能" ON chat_images
  FOR ALL USING (auth.uid() = user_id);

-- 公開メッセージに関連する画像は誰でも閲覧可能
CREATE POLICY "公開メッセージの画像は誰でも閲覧可能" ON chat_images
  FOR SELECT USING (
    id IN (
      SELECT image_id FROM chat_messages 
      WHERE is_public = true AND image_id IS NOT NULL
    )
  );

-- 管理者はすべての画像にアクセス可能
CREATE POLICY "管理者はすべての画像にアクセス可能" ON chat_images
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

-- entriesテーブルのRLSポリシー
-- 自分のエントリーは読み書き可能
CREATE POLICY "ユーザーは自分のエントリーを管理可能" ON entries
  FOR ALL USING (auth.uid() = user_id);

-- 公開エントリーは誰でも閲覧可能
CREATE POLICY "公開エントリーは誰でも閲覧可能" ON entries
  FOR SELECT USING (is_public = true);

-- 管理者はすべてのエントリーにアクセス可能
CREATE POLICY "管理者はすべてのエントリーにアクセス可能" ON entries
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

-- symbol_settingsテーブルのRLSポリシー
-- 自分のシンボル設定のみ読み書き可能
CREATE POLICY "ユーザーは自分のシンボル設定のみ管理可能" ON symbol_settings
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべてのシンボル設定にアクセス可能
CREATE POLICY "管理者はすべてのシンボル設定にアクセス可能" ON symbol_settings
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

-- chart_settingsテーブルのRLSポリシー
-- 自分のチャート設定のみ読み書き可能
CREATE POLICY "ユーザーは自分のチャート設定のみ管理可能" ON chart_settings
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべてのチャート設定にアクセス可能
CREATE POLICY "管理者はすべてのチャート設定にアクセス可能" ON chart_settings
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

-- indicator_settingsテーブルのRLSポリシー
-- 自分のインジケーター設定のみ読み書き可能
CREATE POLICY "ユーザーは自分のインジケーター設定のみ管理可能" ON indicator_settings
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべてのインジケーター設定にアクセス可能
CREATE POLICY "管理者はすべてのインジケーター設定にアクセス可能" ON indicator_settings
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

-- cached_dataテーブルのRLSポリシー
-- キャッシュデータは誰でも読み取り可能
CREATE POLICY "キャッシュデータは誰でも読み取り可能" ON cached_data
  FOR SELECT USING (true);

-- 管理者のみがキャッシュデータを管理可能
CREATE POLICY "管理者のみがキャッシュデータを管理可能" ON cached_data
  FOR INSERT WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

CREATE POLICY "管理者のみがキャッシュデータを更新可能" ON cached_data
  FOR UPDATE USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

CREATE POLICY "管理者のみがキャッシュデータを削除可能" ON cached_data
  FOR DELETE USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

-- user_relationsテーブルのRLSポリシー
-- 自分のフォロー関係は読み書き可能
CREATE POLICY "ユーザーは自分のフォロー関係を管理可能" ON user_relations
  FOR ALL USING (auth.uid() = follower_id);

-- フォロワー/フォロー関係は誰でも閲覧可能
CREATE POLICY "フォロー関係は誰でも閲覧可能" ON user_relations
  FOR SELECT USING (true);

-- 管理者はすべてのフォロー関係にアクセス可能
CREATE POLICY "管理者はすべてのフォロー関係にアクセス可能" ON user_relations
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));

-- backtest_dataテーブルのRLSポリシー
-- 自分のバックテストデータのみ読み書き可能
CREATE POLICY "ユーザーは自分のバックテストデータのみ管理可能" ON backtest_data
  FOR ALL USING (auth.uid() = user_id);

-- 管理者はすべてのバックテストデータにアクセス可能
CREATE POLICY "管理者はすべてのバックテストデータにアクセス可能" ON backtest_data
  FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE is_admin = true));