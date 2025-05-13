-- 06_chat_messages_fk.sql
-- chat_messagesテーブルにconversation_id外部キーを追加
-- 作成日: 2025/5/20

-- chat_messagesテーブルにconversation_idカラムを追加
ALTER TABLE chat_messages
  ADD COLUMN conversation_id UUID;

-- 外部キー制約を追加
ALTER TABLE chat_messages
  ADD CONSTRAINT chat_messages_conversation_fk
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE; 