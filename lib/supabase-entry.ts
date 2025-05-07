// lib/supabase-entry.ts
// Supabaseトレードエントリー関連ユーティリティ関数
// 作成日: 2025/5/7

import { supabase } from './supabase';
import { Database } from '@/types/supabase';

type Entry = Database['public']['Tables']['entries']['Row'];

/**
 * エントリー一覧を取得
 * @param limit 取得件数
 * @param offset オフセット
 * @param isPublicOnly 公開エントリーのみ取得するかどうか
 * @returns エントリー一覧
 */
export const getEntries = async (
  limit = 50,
  offset = 0,
  isPublicOnly = false
): Promise<Entry[]> => {
  let query = supabase
    .from('entries')
    .select('*')
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
 * ユーザーのエントリー一覧を取得
 * @param userId ユーザーID
 * @param limit 取得件数
 * @param offset オフセット
 * @returns エントリー一覧
 */
export const getUserEntries = async (
  userId: string,
  limit = 50,
  offset = 0
): Promise<Entry[]> => {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * シンボルでエントリーを検索
 * @param symbol シンボル
 * @param limit 取得件数
 * @param offset オフセット
 * @param isPublicOnly 公開エントリーのみ取得するかどうか
 * @returns エントリー一覧
 */
export const getEntriesBySymbol = async (
  symbol: string,
  limit = 50,
  offset = 0,
  isPublicOnly = false
): Promise<Entry[]> => {
  let query = supabase
    .from('entries')
    .select('*')
    .eq('symbol', symbol)
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
 * ステータスでエントリーを検索
 * @param status ステータス（open/closed/canceled）
 * @param limit 取得件数
 * @param offset オフセット
 * @param isPublicOnly 公開エントリーのみ取得するかどうか
 * @returns エントリー一覧
 */
export const getEntriesByStatus = async (
  status: 'open' | 'closed' | 'canceled',
  limit = 50,
  offset = 0,
  isPublicOnly = false
): Promise<Entry[]> => {
  let query = supabase
    .from('entries')
    .select('*')
    .eq('status', status)
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
 * エントリーを作成
 * @param userId ユーザーID
 * @param side 売買方向（buy/sell）
 * @param symbol シンボル
 * @param price 価格
 * @param time 時間
 * @param takeProfit 利確価格
 * @param stopLoss 損切価格
 * @param isPublic 公開するかどうか
 * @returns 作成されたエントリー
 */
export const createEntry = async (
  userId: string,
  side: 'buy' | 'sell',
  symbol: string,
  price: number,
  time: Date,
  takeProfit?: number,
  stopLoss?: number,
  isPublic = false
): Promise<Entry> => {
  const { data, error } = await supabase
    .from('entries')
    .insert([
      {
        user_id: userId,
        side,
        symbol,
        price,
        time: time.toISOString(),
        take_profit: takeProfit,
        stop_loss: stopLoss,
        status: 'open',
        is_public: isPublic,
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
 * エントリーを更新
 * @param entryId エントリーID
 * @param updates 更新内容
 * @returns 更新されたエントリー
 */
export const updateEntry = async (
  entryId: string,
  updates: Partial<Omit<Entry, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Entry> => {
  const { data, error } = await supabase
    .from('entries')
    .update(updates)
    .eq('id', entryId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * エントリーを削除
 * @param entryId エントリーID
 * @returns 削除結果
 */
export const deleteEntry = async (entryId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', entryId);

  if (error) {
    throw error;
  }

  return true;
};

/**
 * エントリーをクローズ
 * @param entryId エントリーID
 * @param exitPrice 決済価格
 * @param exitTime 決済時間
 * @returns 更新されたエントリー
 */
export const closeEntry = async (
  entryId: string,
  exitPrice: number,
  exitTime: Date
): Promise<Entry> => {
  // まずエントリーを取得して利益を計算
  const { data: entry, error: fetchError } = await supabase
    .from('entries')
    .select('*')
    .eq('id', entryId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  // 利益を計算
  let profit: number | null = null;
  if (entry) {
    if (entry.side === 'buy') {
      profit = exitPrice - entry.price;
    } else {
      profit = entry.price - exitPrice;
    }
  }

  // エントリーを更新
  const { data, error } = await supabase
    .from('entries')
    .update({
      status: 'closed',
      exit_price: exitPrice,
      exit_time: exitTime.toISOString(),
      profit,
    })
    .eq('id', entryId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * エントリーをキャンセル
 * @param entryId エントリーID
 * @returns 更新されたエントリー
 */
export const cancelEntry = async (entryId: string): Promise<Entry> => {
  const { data, error } = await supabase
    .from('entries')
    .update({
      status: 'canceled',
    })
    .eq('id', entryId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * エントリーのリアルタイム購読
 * @param callback コールバック関数
 * @param isPublicOnly 公開エントリーのみ購読するかどうか
 * @returns 購読解除関数
 */
export const subscribeToEntries = (
  callback: (entry: Entry) => void,
  isPublicOnly = false
) => {
  let query = supabase
    .channel('entries')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'entries',
        ...(isPublicOnly ? { filter: 'is_public=eq.true' } : {}),
      },
      (payload) => {
        callback(payload.new as Entry);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(query);
  };
};