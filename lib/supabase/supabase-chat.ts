// lib/supabase-chat.ts
// Supabaseチャット関連ユーティリティ関数
// 作成日: 2025/5/7
// 更新日: 2025/5/27 - 会話関連の機能をsupabase-conversations.tsに移動
// 更新日: 2025/5/28 - 会話関連の関数を完全に削除

import { supabase } from './supabase';
import { Tables, TablesInsert, TablesUpdate } from '@/types/network/supabase';

// チャット関連の型定義
type ChatMessage = Tables<'chat_messages'>;
type ChatMessageInsert = TablesInsert<'chat_messages'>;
type ChatMessageUpdate = TablesUpdate<'chat_messages'>;

type ChatImage = Tables<'chat_images'>;
type ChatImageInsert = TablesInsert<'chat_images'>;

// 注: 会話関連の型定義と機能はsupabase-conversations.tsに移動しました

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
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch chat messages:', error);
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
    console.error('Failed to fetch user chat messages:', error);
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
 * @param conversationId 会話ID
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
    conversation_id: conversationId || null
  };

  const { data, error } = await supabase
    .from('chat_messages')
    .insert([messageData])
    .select('*, chat_images(*)')
    .single();

  if (error) {
    console.error('Failed to create chat message:', error);
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
    .select('*, chat_images(*)')
    .single();

  if (error) {
    console.error('Failed to update chat message:', error);
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
    console.error('Failed to delete chat message:', error);
    throw error;
  }

  return true;
};

/**
 * チャット画像をアップロード
 * @param userId ユーザーID
 * @param imageData 画像データ（Base64）
 * @param imageCaption 画像キャプション
 * @returns アップロードされた画像情報
 */
export const uploadChatImage = async (
  userId: string,
  imageData: string,
  imageCaption?: string
): Promise<ChatImage> => {
  // Base64データをBlobに変換
  const base64Data = imageData.split(',')[1];
  const mimeType = imageData.match(/^data:(.*?);/)?.[1] || 'image/png';
  const byteCharacters = atob(base64Data);
  const byteArrays = [];

  for (let i = 0; i < byteCharacters.length; i++) {
    byteArrays.push(byteCharacters.charCodeAt(i));
  }

  const blob = new Blob([new Uint8Array(byteArrays)], { type: mimeType });
  const file = new File([blob], `chat-image-${Date.now()}.${mimeType.split('/')[1]}`, {
    type: mimeType,
  });

  // 画像データをStorageにアップロード
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('chat-images')
    .upload(`${userId}/${file.name}`, file);

  if (uploadError) {
    console.error('Failed to upload chat image:', uploadError);
    throw uploadError;
  }

  const imageUrl = supabase.storage.from('chat-images').getPublicUrl(uploadData.path).data.publicUrl;

  // 画像情報をデータベースに保存
  const imageRecord: ChatImageInsert = {
    user_id: userId,
    image_data: imageUrl,
    image_caption: imageCaption || null,
  };

  const { data, error } = await supabase
    .from('chat_images')
    .insert([imageRecord])
    .select()
    .single();

  if (error) {
    console.error('Failed to create chat image record:', error);
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
    console.error('Failed to fetch chat image:', error);
    throw error;
  }

  return data;
};

/**
 * チャットメッセージをリアルタイム購読
 * @param callback メッセージ受信時のコールバック
 * @param isPublicOnly 公開メッセージのみ購読するかどうか
 * @returns 購読解除関数
 */
export const subscribeToChatMessages = (
  callback: (message: ChatMessage) => void,
  isPublicOnly = false
) => {
  const query = supabase
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

// 注: 以下の会話関連機能はsupabase-conversations.tsに移動しました
// - getConversationMessages
// - createConversationMessage
// - subscribeToConversationMessages