// lib/supabase/features/conversations.ts
// Supabase会話（スレッド）関連ユーティリティ関数（SSR対応版）
// 作成日: 2025/6/21 - 初期実装、supabase-conversations.tsからの移行
// 更新日: 2023/7/5 - Dependency Injection パターンに更新 (supabaseClient ?? createClient())

import { createClient } from '@/lib/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/types/network/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// 会話関連の型定義
type Conversation = Tables<'conversations'>;
type ConversationInsert = TablesInsert<'conversations'>;
type ConversationUpdate = TablesUpdate<'conversations'>;

// チャットメッセージ関連の型定義
type ChatMessage = Tables<'chat_messages'>;
type ChatMessageInsert = TablesInsert<'chat_messages'>;

/**
 * ユーザーの会話一覧を取得
 * @param userId ユーザーID
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns 会話一覧
 */
export const getConversations = async (
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<Conversation[]> => {
  const supabase = supabaseClient ?? createClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
    
  if (error) throw error;
  return data || [];
};

/**
 * 特定の会話を取得
 * @param conversationId 会話ID
 * @param userId ユーザーID（所有者確認用）
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns 会話情報
 */
export const getConversation = async (
  conversationId: string,
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<Conversation> => {
  const supabase = supabaseClient ?? createClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * 会話を作成
 * @param userId ユーザーID
 * @param title 会話タイトル
 * @param systemPrompt システムプロンプト
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns 作成された会話
 */
export const createConversation = async (
  userId: string,
  title: string,
  systemPrompt?: string,
  supabaseClient?: SupabaseClient
): Promise<Conversation> => {
  const supabase = supabaseClient ?? createClient();
  const { data, error } = await supabase
    .from('conversations')
    .insert([
      {
        user_id: userId,
        title,
        system_prompt: systemPrompt || null,
      },
    ])
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * 会話を更新
 * @param conversationId 会話ID
 * @param userId ユーザーID（所有者確認用）
 * @param updates 更新内容
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns 更新された会話
 */
export const updateConversation = async (
  conversationId: string,
  userId: string,
  updates: Partial<ConversationUpdate>,
  supabaseClient?: SupabaseClient
): Promise<Conversation> => {
  const supabase = supabaseClient ?? createClient();
  // まず所有者確認
  await verifyConversationOwner(conversationId, userId, supabase);
  
  // 更新日時を自動設定
  const updatesWithTimestamp = {
    ...updates,
    updated_at: new Date().toISOString(),
  };
  
  const { data, error } = await supabase
    .from('conversations')
    .update(updatesWithTimestamp)
    .eq('id', conversationId)
    .eq('user_id', userId) // 念のため所有者フィルタも追加
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * 会話を削除
 * @param conversationId 会話ID
 * @param userId ユーザーID（所有者確認用）
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 */
export const deleteConversation = async (
  conversationId: string,
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<void> => {
  const supabase = supabaseClient ?? createClient();
  // まず所有者確認
  await verifyConversationOwner(conversationId, userId, supabase);
  
  // 関連するメッセージを削除
  const { error: messagesError } = await supabase
    .from('chat_messages')
    .delete()
    .eq('conversation_id', conversationId);
    
  if (messagesError) throw messagesError;
  
  // 会話を削除
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', userId); // 念のため所有者フィルタも追加
    
  if (error) throw error;
};

/**
 * 会話の所有者確認（内部ヘルパー関数）
 * @param conversationId 会話ID
 * @param userId ユーザーID
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @throws 所有者でない場合はエラー
 */
const verifyConversationOwner = async (
  conversationId: string,
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<void> => {
  const supabase = supabaseClient ?? createClient();
  const { data, error } = await supabase
    .from('conversations')
    .select('user_id')
    .eq('id', conversationId)
    .single();
    
  if (error) throw error;
  if (!data || data.user_id !== userId) {
    throw new Error('Unauthorized: You do not own this conversation');
  }
};

/**
 * 会話のメッセージを取得
 * @param conversationId 会話ID
 * @param limit 取得件数
 * @param offset オフセット
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns チャットメッセージ一覧
 */
export const getConversationMessages = async (
  conversationId: string,
  limit = 50,
  offset = 0,
  supabaseClient?: SupabaseClient
): Promise<ChatMessage[]> => {
  const supabase = supabaseClient ?? createClient();
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
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
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
  imageId?: string,
  supabaseClient?: SupabaseClient
): Promise<ChatMessage> => {
  const supabase = supabaseClient ?? createClient();
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
    .select('*, chat_images(*)')
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * 会話のメッセージ購読
 * @param conversationId 会話ID
 * @param callback コールバック関数
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns 購読解除関数
 */
export const subscribeToConversationMessages = (
  conversationId: string,
  callback: (message: ChatMessage) => void,
  supabaseClient?: SupabaseClient
) => {
  const supabase = supabaseClient ?? createClient();
  const channel = supabase
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
    supabase.removeChannel(channel);
  };
}; 