// lib/supabase/features/chat.ts
// Supabaseチャット関連ユーティリティ関数（SSR対応版）
// 作成日: 2025/5/7 - 初期実装
// 更新日: 2025/5/27 - 会話関連の機能をsupabase-conversations.tsに移動
// 更新日: 2025/5/28 - 会話関連の関数を完全に削除
// 更新日: 2025/6/2 - リアルタイム購読機能の安定化と再接続機能を実装
// 更新日: 2025/6/5 - subscribeToConversationMessages関数は非推奨となりsupabase-conversations.tsに移行
// 更新日: 2025/6/20 - SSRクライアント対応
// 更新日: 2023/7/5 - Dependency Injection パターンに更新 (supabaseClient ?? createClient())
// 更新日: 2025/9/17 - uploadChatImage関数をサーバー環境でも動作するように修正

import { createClient } from '@/lib/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/types/network/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

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
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns チャットメッセージ一覧
 */
export const getChatMessages = async (
  limit = 50,
  offset = 0,
  isPublicOnly = false,
  conversationId?: string,
  supabaseClient?: SupabaseClient
): Promise<ChatMessage[]> => {
  const supabase = supabaseClient ?? createClient();
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
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns チャットメッセージ一覧
 */
export const getUserChatMessages = async (
  userId: string,
  limit = 50,
  offset = 0,
  supabaseClient?: SupabaseClient
): Promise<ChatMessage[]> => {
  const supabase = supabaseClient ?? createClient();
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
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
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
  conversationId?: string,
  supabaseClient?: SupabaseClient
): Promise<ChatMessage> => {
  const supabase = supabaseClient ?? createClient();
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
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns 更新されたチャットメッセージ
 */
export const updateChatMessage = async (
  messageId: string,
  updates: ChatMessageUpdate,
  supabaseClient?: SupabaseClient
): Promise<ChatMessage> => {
  const supabase = supabaseClient ?? createClient();
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
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns 削除結果
 */
export const deleteChatMessage = async (
  messageId: string,
  supabaseClient?: SupabaseClient
): Promise<boolean> => {
  const supabase = supabaseClient ?? createClient();
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
 * 環境がブラウザかどうかを判定
 * @returns ブラウザ環境かどうか
 */
const isBrowser = () => typeof window !== 'undefined';

/**
 * チャット画像をアップロード
 * 
 * ブラウザとサーバー（Node.js/Edge）の両環境で動作します。
 * ブラウザでは Blob/File API を使用し、サーバーでは Buffer を使用します。
 * 
 * @param userId ユーザーID
 * @param imageData 画像データ（Base64）
 * @param imageCaption 画像キャプション
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns アップロードされた画像情報
 */
export const uploadChatImage = async (
  userId: string,
  imageData: string,
  imageCaption?: string,
  supabaseClient?: SupabaseClient
): Promise<ChatImage> => {
  const supabase = supabaseClient ?? createClient();
  
  // Base64データからMIMEタイプを抽出
  const mimeType = imageData.match(/^data:(.*?);/)?.[1] || 'image/png';
  const base64Data = imageData.split(',')[1];
  const extension = mimeType.split('/')[1];
  const filename = `chat-image-${Date.now()}.${extension}`;
  const path = `${userId}/${filename}`;
  
  // 環境に応じた方法でデータをアップロード
  let uploadData;
  let uploadError;
  
  if (isBrowser()) {
    // ブラウザ環境 - Blob/File APIを使用
    try {
      const byteCharacters = atob(base64Data);
      const byteArrays = [];
  
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArrays.push(byteCharacters.charCodeAt(i));
      }
  
      const blob = new Blob([new Uint8Array(byteArrays)], { type: mimeType });
      const file = new File([blob], filename, { type: mimeType });
      
      const result = await supabase.storage
        .from('chat-images')
        .upload(path, file);
        
      uploadData = result.data;
      uploadError = result.error;
    } catch (err) {
      console.error('Browser upload failed:', err);
      throw new Error(`Browser image upload failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    // サーバー環境 - Bufferを使用
    try {
      // Base64をBufferに変換
      const buffer = Buffer.from(base64Data, 'base64');
      
      const result = await supabase.storage
        .from('chat-images')
        .upload(path, buffer, {
          contentType: mimeType,
          cacheControl: '3600'
        });
        
      uploadData = result.data;
      uploadError = result.error;
    } catch (err) {
      console.error('Server upload failed:', err);
      throw new Error(`Server image upload failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (uploadError) {
    console.error('Failed to upload chat image:', uploadError);
    throw uploadError;
  }

  if (!uploadData) {
    throw new Error('No upload data returned from storage, but no error was thrown.');
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
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns 画像情報またはnull
 */
export const getChatImage = async (
  imageId: string,
  supabaseClient?: SupabaseClient
): Promise<ChatImage | null> => {
  const supabase = supabaseClient ?? createClient();
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
 * @param callback コールバック関数
 * @param isPublicOnly 公開メッセージのみ対象とするかどうか
 * @param onError エラーハンドラ（オプション）
 * @param onStatusChange ステータス変更ハンドラ（オプション）
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns 購読解除関数
 */
export const subscribeToChatMessages = (
  callback: (message: ChatMessage) => void,
  isPublicOnly = false,
  onError?: (error: Error) => void,
  onStatusChange?: (status: string) => void,
  supabaseClient?: SupabaseClient
) => {
  const supabase = supabaseClient ?? createClient();
  let retryCount = 0;
  const maxRetries = 5;
  const retryDelay = 1000; // 1秒
  let channel: any;
  
  const subscribe = () => {
    try {
      if (channel) {
        supabase.removeChannel(channel);
      }
      
      channel = supabase
        .channel('chat-messages-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'chat_messages',
            filter: isPublicOnly ? 'is_public=eq.true' : undefined,
          },
          (payload) => {
            retryCount = 0; // 成功したらリトライカウントをリセット
            // 適切な型変換
            const message = payload.new as ChatMessage;
            callback(message);
          }
        )
        .subscribe((status: string) => {
          if (onStatusChange) {
            onStatusChange(status);
          }

          if (status === 'SUBSCRIBED') {
            console.log('Subscribed to chat messages changes');
          } else if (status === 'CHANNEL_ERROR') {
            const err = new Error(`Subscription error: ${status}`);
            handleError(err);
          } else if (status === 'TIMED_OUT') {
            const err = new Error('Subscription timed out');
            handleError(err);
          }
        });
    } catch (error) {
      handleError(error as Error);
    }
  };

  const handleError = (error: Error) => {
    console.error('Chat subscription error:', error);

    if (onError) {
      onError(error);
    }

    // リトライロジック
    if (retryCount < maxRetries) {
      retryCount++;
      console.log(`Retrying subscription (${retryCount}/${maxRetries}) in ${retryDelay}ms`);
      setTimeout(subscribe, retryDelay * retryCount);
    } else {
      console.error('Max retries reached. Giving up on subscription.');
    }
  };
  
  // 初回購読開始
  subscribe();
  
  // 購読解除関数を返す
  return () => {
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