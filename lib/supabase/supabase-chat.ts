// lib/supabase-chat.ts
// Supabaseチャット関連ユーティリティ関数
// 作成日: 2025/5/7

import { supabase } from './supabase';
import { Database } from '@/types/supabase';

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type ChatImage = Database['public']['Tables']['chat_images']['Row'];

/**
 * チャットメッセージを取得
 * @param limit 取得件数
 * @param offset オフセット
 * @param isPublicOnly 公開メッセージのみ取得するかどうか
 * @returns チャットメッセージ一覧
 */
export const getChatMessages = async (
  limit = 50,
  offset = 0,
  isPublicOnly = false
): Promise<ChatMessage[]> => {
  let query = supabase
    .from('chat_messages')
    .select('*, chat_images(*)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (isPublicOnly) {
    query = query.eq('is_public', true);
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
  imageId?: string
): Promise<ChatMessage> => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([
      {
        user_id: userId,
        role,
        content,
        is_proposal: isProposal,
        is_public: isPublic,
        proposal_type: proposalType,
        price,
        take_profit: takeProfit,
        stop_loss: stopLoss,
        image_id: imageId,
      },
    ])
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
  updates: Partial<Omit<ChatMessage, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
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
  const { data, error } = await supabase
    .from('chat_images')
    .insert([
      {
        user_id: userId,
        image_data: imageData,
        image_caption: imageCaption,
      },
    ])
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
export const getChatImage = async (imageId: string): Promise<ChatImage> => {
  const { data, error } = await supabase
    .from('chat_images')
    .select('*')
    .eq('id', imageId)
    .single();

  if (error) {
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