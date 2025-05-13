-- 09_indexes.sql
-- マルチスレッドチャット機能のためのインデックス追加
-- 作成日: 2025/5/20

-- chat_messagesテーブルにconversation_idと作成日時のインデックスを追加
-- 会話ごとのメッセージを時系列で検索するクエリを高速化
CREATE INDEX IF NOT EXISTS idx_messages_conv_time
  ON chat_messages (conversation_id, created_at DESC);

-- conversationsテーブルにuser_idと作成日時のインデックスを追加
-- ユーザーごとの会話一覧を取得するクエリを高速化
CREATE INDEX IF NOT EXISTS idx_conversations_user_time
  ON conversations (user_id, updated_at DESC); 