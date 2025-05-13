-- 07_backfill_conversation_id.sql
-- 既存メッセージを初期会話に移行するマイグレーション
-- 作成日: 2025/5/20

-- ユーザーごとに1つの初期会話を作成し、既存メッセージを関連付け
WITH ins AS (
  INSERT INTO conversations (user_id, title)
  SELECT DISTINCT user_id, 'Initial conversation'
  FROM chat_messages
  RETURNING id, user_id
)
UPDATE chat_messages m
SET    conversation_id = ins.id
FROM   ins
WHERE  m.user_id = ins.user_id
  AND  m.conversation_id IS NULL; 