-- 03_indexes.sql
-- インデックス作成ファイル
-- 作成日: 2025/5/7

-- chat_messagesテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_proposal ON chat_messages(is_proposal);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_public ON chat_messages(is_public);
COMMENT ON INDEX idx_chat_messages_user_id IS 'ユーザーごとのメッセージ検索を高速化';
COMMENT ON INDEX idx_chat_messages_created_at IS '時系列順のメッセージ取得を高速化';
COMMENT ON INDEX idx_chat_messages_is_proposal IS 'トレード提案のフィルタリングを高速化';
COMMENT ON INDEX idx_chat_messages_is_public IS '公開メッセージのフィルタリングを高速化';

-- entriesテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_status ON entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_symbol ON entries(symbol);
CREATE INDEX IF NOT EXISTS idx_entries_user_status ON entries(user_id, status);
CREATE INDEX IF NOT EXISTS idx_entries_is_public ON entries(is_public);
COMMENT ON INDEX idx_entries_user_id IS 'ユーザーごとのエントリー検索を高速化';
COMMENT ON INDEX idx_entries_status IS 'ステータスによるエントリーのフィルタリングを高速化';
COMMENT ON INDEX idx_entries_symbol IS 'シンボルによるエントリーのフィルタリングを高速化';
COMMENT ON INDEX idx_entries_user_status IS 'ユーザーとステータスの組み合わせによる検索を高速化';
COMMENT ON INDEX idx_entries_is_public IS '公開エントリーのフィルタリングを高速化';

-- symbol_settingsテーブルのインデックス
CREATE UNIQUE INDEX IF NOT EXISTS idx_symbol_settings_user_symbol ON symbol_settings(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_symbol_settings_is_favorite ON symbol_settings(is_favorite);
COMMENT ON INDEX idx_symbol_settings_user_symbol IS 'ユーザーとシンボルの組み合わせの一意性を保証';
COMMENT ON INDEX idx_symbol_settings_is_favorite IS 'お気に入りシンボルのフィルタリングを高速化';

-- cached_dataテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_cached_data_composite ON cached_data(data_type, symbol, timeframe);
CREATE INDEX IF NOT EXISTS idx_cached_data_expires_at ON cached_data(expires_at);
COMMENT ON INDEX idx_cached_data_composite IS 'データタイプ、シンボル、タイムフレームの組み合わせによる検索を高速化';
COMMENT ON INDEX idx_cached_data_expires_at IS '期限切れのキャッシュデータの検索を高速化';

-- user_relationsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_user_relations_follower ON user_relations(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_relations_following ON user_relations(following_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_relations_unique ON user_relations(follower_id, following_id);
COMMENT ON INDEX idx_user_relations_follower IS 'フォロワーによる検索を高速化';
COMMENT ON INDEX idx_user_relations_following IS 'フォロー対象による検索を高速化';
COMMENT ON INDEX idx_user_relations_unique IS 'フォロー関係の一意性を保証';

-- profilesテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
COMMENT ON INDEX idx_profiles_user_id IS 'ユーザーIDによるプロフィール検索を高速化';

-- chart_settingsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_chart_settings_user_id ON chart_settings(user_id);
COMMENT ON INDEX idx_chart_settings_user_id IS 'ユーザーIDによるチャート設定検索を高速化';

-- indicator_settingsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_indicator_settings_user_id ON indicator_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_indicator_settings_chart_settings_id ON indicator_settings(chart_settings_id);
COMMENT ON INDEX idx_indicator_settings_user_id IS 'ユーザーIDによるインジケーター設定検索を高速化';
COMMENT ON INDEX idx_indicator_settings_chart_settings_id IS 'チャート設定IDによるインジケーター設定検索を高速化';

-- backtest_dataテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_backtest_data_user_id ON backtest_data(user_id);
CREATE INDEX IF NOT EXISTS idx_backtest_data_symbol ON backtest_data(symbol);
COMMENT ON INDEX idx_backtest_data_user_id IS 'ユーザーIDによるバックテストデータ検索を高速化';
COMMENT ON INDEX idx_backtest_data_symbol IS 'シンボルによるバックテストデータ検索を高速化';

-- chat_imagesテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_chat_images_user_id ON chat_images(user_id);
COMMENT ON INDEX idx_chat_images_user_id IS 'ユーザーIDによる画像検索を高速化';