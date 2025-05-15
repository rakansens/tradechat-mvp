// lib/supabase/features/chat.ts
// Supabaseチャット関連ユーティリティ関数（SSR対応版）
// 作成日: 2025/5/7 - 初期実装
// 更新日: 2025/5/27 - 会話関連の機能をsupabase-conversations.tsに移動
// 更新日: 2025/5/28 - 会話関連の関数を完全に削除
// 更新日: 2025/6/2 - リアルタイム購読機能の安定化と再接続機能を実装
// 更新日: 2025/6/5 - subscribeToConversationMessages関数は非推奨となりsupabase-conversations.tsに移行
// 更新日: 2025/6/20 - SSRクライアント対応

import { createClient } from '@/lib/supabase/client';
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
  const supabase = createClient();
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
  const supabase = createClient();
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
  const supabase = createClient();
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
  const supabase = createClient();
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
  const supabase = createClient();
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
  const supabase = createClient();
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
  const supabase = createClient();
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
 * チャットメッセージをリアルタイム購読（エラーハンドリングと再接続機能強化版）
 * @param callback メッセージ受信時のコールバック
 * @param isPublicOnly 公開メッセージのみ購読するかどうか
 * @param onError エラー発生時のコールバック
 * @param onStatusChange ステータス変更時のコールバック
 * @returns 購読解除関数
 */
export const subscribeToChatMessages = (
  callback: (message: ChatMessage) => void,
  isPublicOnly = false,
  onError?: (error: Error) => void,
  onStatusChange?: (status: string) => void
) => {
  const supabase = createClient();
  let isSubscribed = true;
  let retryCount = 0;
  const maxRetries = 5;
  const retryDelay = 2000; // ミリ秒
  let channel: any;
  
  // 購読処理
  const subscribe = () => {
    try {
      if (onStatusChange) onStatusChange('CONNECTING');
      
      channel = supabase
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
            if (isSubscribed) {
              callback(payload.new as ChatMessage);
            }
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('チャットメッセージの購読開始');
            if (onStatusChange) onStatusChange('SUBSCRIBED');
            // 接続成功時に再試行カウントをリセット
            retryCount = 0;
          } else if (status === 'CHANNEL_ERROR') {
            console.error('チャット購読エラー:', err);
            if (onStatusChange) onStatusChange('ERROR');
            if (onError) onError(new Error(`購読エラー: ${err?.message || '不明なエラー'}`));
            
            // 再接続ロジック
            if (isSubscribed && retryCount < maxRetries) {
              retryCount++;
              console.log(`再接続試行 ${retryCount}/${maxRetries}...`);
              if (onStatusChange) onStatusChange('RECONNECTING');
              
              setTimeout(() => {
                if (isSubscribed) {
                  if (channel) {
                    supabase.removeChannel(channel);
                  }
                  subscribe();
                }
              }, retryDelay * retryCount); // 指数バックオフ
            } else if (retryCount >= maxRetries) {
              if (onStatusChange) onStatusChange('MAX_RETRIES_EXCEEDED');
              if (onError) onError(new Error('最大再接続試行回数を超えました'));
            }
          }
        });
      
      return channel;
    } catch (error) {
      console.error('チャット購読設定エラー:', error);
      if (onStatusChange) onStatusChange('ERROR');
      if (onError) onError(error instanceof Error ? error : new Error('不明なエラー'));
      return null;
    }
  };
  
  // 購読開始
  channel = subscribe();
  
  // 購読解除関数を返す
  return () => {
    console.log('チャットメッセージの購読解除');
    isSubscribed = false;
    if (channel) {
      supabase.removeChannel(channel);
    }
  };
};

/**
 * @deprecated 会話関連の機能はsupabase-conversations.tsに移動しました。代わりに {@link import('@/lib/supabase/features/conversations').subscribeToConversationMessages} を使用してください。
 */
// 会話特化のチャットメッセージをリアルタイム購読機能は削除し、代わりに注釈を追加
// この関数の実装はsupabase-conversations.tsに移動しました

// 注: 以下の会話関連機能はsupabase-conversations.tsに移動しました
// - getConversationMessages
// - createConversationMessage
// - subscribeToConversationMessages 