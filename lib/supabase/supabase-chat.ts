// lib/supabase-chat.ts
// Supabaseチャット関連ユーティリティ関数
// 作成日: 2025/5/7
// 更新日: 2025/5/27 - 会話（スレッド）機能を追加し、型参照を最新の型定義に更新

import { supabase } from './supabase';
import { Tables, TablesInsert, TablesUpdate } from '@/types/network/supabase';

// チャット関連の型定義
type ChatMessage = Tables<'chat_messages'>;
type ChatMessageInsert = TablesInsert<'chat_messages'>;
type ChatMessageUpdate = TablesUpdate<'chat_messages'>;

type ChatImage = Tables<'chat_images'>;
type ChatImageInsert = TablesInsert<'chat_images'>;

// 会話関連の型定義
type Conversation = Tables<'conversations'>;
type ConversationInsert = TablesInsert<'conversations'>;
type ConversationUpdate = TablesUpdate<'conversations'>;

/**
 * チャットメッセージを取得
 * @param limit 取得件数
 * @param offset オフセット
 * @param isPublicOnly 公開メッセージのみ取得するかどうか
 * @param conversationId 特定の会話のメッセージのみを取得する場合の会話ID
 * @returns チャットメッセージ一覧
 */
export const getChatMessages = async (
  limit = 50,
  offset = 0,
  isPublicOnly = false,
  conversationId?: string
): Promise<ChatMessage[]> => {
  let query = supabase
    .from('chat_messages')
    .select('*, chat_images(*)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (isPublicOnly) {
    query = query.eq('is_public', true);
  }
  
  if (conversationId) {
    query = query.eq('conversation_id', conversationId);
  } else {
    // 会話IDが指定されていない場合は、会話IDがnullのメッセージのみを取得（旧メッセージ互換）
    query = query.is('conversation_id', null);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * ユーザーのチャットメッセージを取得
 * @param userId ユーザーID
 * @param limit 取得件数
 * @param offset オフセット
 * @returns チャットメッセージ一覧
 */
export const getUserChatMessages = async (
  userId: string,
  limit = 50,
  offset = 0
): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*, chat_images(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * チャットメッセージを作成
 * @param userId ユーザーID
 * @param role ロール（user/assistant）
 * @param content 内容
 * @param isProposal 提案かどうか
 * @param isPublic 公開するかどうか
 * @param proposalType 提案タイプ（buy/sell）
 * @param price 価格
 * @param takeProfit 利確価格
 * @param stopLoss 損切価格
 * @param imageId 画像ID
 * @param conversationId 会話ID（省略可）
 * @returns 作成されたチャットメッセージ
 */
export const createChatMessage = async (
  userId: string,
  role: 'user' | 'assistant',
  content: string,
  isProposal = false,
  isPublic = false,
  proposalType?: 'buy' | 'sell',
  price?: number,
  takeProfit?: number,
  stopLoss?: number,
  imageId?: string,
  conversationId?: string
): Promise<ChatMessage> => {
  const messageData: ChatMessageInsert = {
    user_id: userId,
    role,
    content,
    is_proposal: isProposal,
    is_public: isPublic,
    proposal_type: proposalType || null,
    price: price || null,
    take_profit: takeProfit || null,
    stop_loss: stopLoss || null,
    image_id: imageId || null,
    conversation_id: conversationId || null,
  };

  const { data, error } = await supabase
    .from('chat_messages')
    .insert([messageData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * チャットメッセージを更新
 * @param messageId メッセージID
 * @param updates 更新内容
 * @returns 更新されたチャットメッセージ
 */
export const updateChatMessage = async (
  messageId: string,
  updates: ChatMessageUpdate
): Promise<ChatMessage> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .update(updates)
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * チャットメッセージを削除
 * @param messageId メッセージID
 * @returns 削除結果
 */
export const deleteChatMessage = async (messageId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    throw error;
  }

  return true;
};

/**
 * チャット画像をアップロード
 * @param userId ユーザーID
 * @param imageData 画像データ（Base64エンコード）
 * @param imageCaption 画像キャプション
 * @returns アップロードされた画像情報
 */
export const uploadChatImage = async (
  userId: string,
  imageData: string,
  imageCaption?: string
): Promise<ChatImage> => {
  const imageInfo: ChatImageInsert = {
    user_id: userId,
    image_data: imageData,
    image_caption: imageCaption || null,
  };

  const { data, error } = await supabase
    .from('chat_images')
    .insert([imageInfo])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * チャット画像を取得
 * @param imageId 画像ID
 * @returns 画像情報
 */
export const getChatImage = async (imageId: string): Promise<ChatImage | null> => {
  const { data, error } = await supabase
    .from('chat_images')
    .select('*')
    .eq('id', imageId)
    .single();

  if (error) {
    // レコードが見つからない場合はnullを返す
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
};

/**
 * チャットメッセージのリアルタイム購読
 * @param callback コールバック関数
 * @param isPublicOnly 公開メッセージのみ購読するかどうか
 * @returns 購読解除関数
 */
export const subscribeToChatMessages = (
  callback: (message: ChatMessage) => void,
  isPublicOnly = false
) => {
  let query = supabase
    .channel('chat_messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        ...(isPublicOnly ? { filter: 'is_public=eq.true' } : {}),
      },
      (payload) => {
        callback(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(query);
  };
};

/**
 * 会話を作成
 * @param userId ユーザーID
 * @param title 会話タイトル
 * @param systemPrompt システムプロンプト
 * @returns 作成された会話
 */
export const createConversation = async (
  userId: string,
  title: string,
  systemPrompt?: string
): Promise<Conversation> => {
  const conversationData: ConversationInsert = {
    user_id: userId,
    title,
    system_prompt: systemPrompt || null,
  };

  const { data, error } = await supabase
    .from('conversations')
    .insert([conversationData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * 会話を取得
 * @param conversationId 会話ID
 * @returns 会話情報
 */
export const getConversation = async (
  conversationId: string
): Promise<Conversation | null> => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (error) {
    // レコードが見つからない場合はnullを返す
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
};

/**
 * ユーザーの会話一覧を取得
 * @param userId ユーザーID
 * @param limit 取得件数
 * @param offset オフセット
 * @returns 会話一覧
 */
export const getUserConversations = async (
  userId: string,
  limit = 20,
  offset = 0
): Promise<Conversation[]> => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * 会話を更新
 * @param conversationId 会話ID
 * @param updates 更新内容
 * @returns 更新された会話
 */
export const updateConversation = async (
  conversationId: string,
  updates: ConversationUpdate
): Promise<Conversation> => {
  const { data, error } = await supabase
    .from('conversations')
    .update(updates)
    .eq('id', conversationId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * 会話を削除
 * @param conversationId 会話ID
 * @returns 削除結果
 */
export const deleteConversation = async (conversationId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);

  if (error) {
    throw error;
  }

  return true;
};

/**
 * 会話のメッセージを取得
 * @param conversationId 会話ID
 * @param limit 取得件数
 * @param offset オフセット
 * @returns チャットメッセージ一覧
 */
export const getConversationMessages = async (
  conversationId: string,
  limit = 50,
  offset = 0
): Promise<ChatMessage[]> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*, chat_images(*)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * 会話にメッセージを作成
 * @param userId ユーザーID
 * @param conversationId 会話ID
 * @param role ロール（user/assistant）
 * @param content 内容
 * @param isProposal 提案かどうか
 * @param isPublic 公開するかどうか
 * @param proposalType 提案タイプ（buy/sell）
 * @param price 価格
 * @param takeProfit 利確価格
 * @param stopLoss 損切価格
 * @param imageId 画像ID
 * @returns 作成されたチャットメッセージ
 */
export const createConversationMessage = async (
  userId: string,
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  isProposal = false,
  isPublic = false,
  proposalType?: 'buy' | 'sell',
  price?: number,
  takeProfit?: number,
  stopLoss?: number,
  imageId?: string
): Promise<ChatMessage> => {
  const messageData: ChatMessageInsert = {
    user_id: userId,
    conversation_id: conversationId,
    role,
    content,
    is_proposal: isProposal,
    is_public: isPublic,
    proposal_type: proposalType || null,
    price: price || null,
    take_profit: takeProfit || null,
    stop_loss: stopLoss || null,
    image_id: imageId || null,
  };

  const { data, error } = await supabase
    .from('chat_messages')
    .insert([messageData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * 会話メッセージのリアルタイム購読
 * @param conversationId 会話ID
 * @param callback コールバック関数
 * @returns 購読解除関数
 */
export const subscribeToConversationMessages = (
  conversationId: string,
  callback: (message: ChatMessage) => void
) => {
  let query = supabase
    .channel(`conversation_${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(query);
  };
};