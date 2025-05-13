-- 08_rls_conversations.sql
-- conversationsテーブルとchat_messagesテーブルにRLS（行レベルセキュリティ）を設定
-- 作成日: 2025/5/20

-- conversationsテーブルのRLS有効化
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- conversationsテーブルのポリシー作成（所有者のみアクセス可能）
CREATE POLICY convo_owner ON conversations
  FOR ALL
  USING (auth.uid() = user_id);

-- chat_messagesテーブルのRLS有効化
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- chat_messagesテーブルのポリシー作成（会話所有者のみアクセス可能）
CREATE POLICY msg_owner ON chat_messages
  FOR ALL
  USING (
    auth.uid() = (SELECT user_id
                  FROM conversations c
                  WHERE c.id = conversation_id)
  ); 