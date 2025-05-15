// lib/supabase/features/entry.ts
// Supabaseトレードエントリー関連ユーティリティ関数（SSR対応版）
// 作成日: 2025/6/21 - 初期実装、supabase-entry.tsからの移行
// 更新日: 2025/6/25 - Supabase型定義に合わせてZodスキーマとマッピングを更新
// 更新日: 2025/6/26 - ページネーション機能付きのgetEntriesPaginated関数を追加

import { createClient } from '@/lib/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/types/network/supabase';
import { unstable_cache } from 'next/cache';
import { z } from 'zod';

// エントリー関連の型定義
export type Entry = Tables<'entries'>;
export type EntryInsert = TablesInsert<'entries'>;
export type EntryUpdateParams = TablesUpdate<'entries'>;

// エントリーのZodスキーマ
export const entrySchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string(),
  symbol: z.string(),
  side: z.enum(['buy', 'sell']),
  price: z.number().positive(),
  time: z.string().or(z.date()),
  take_profit: z.number().positive().nullable().optional(),
  stop_loss: z.number().positive().nullable().optional(),
  exit_price: z.number().positive().nullable().optional(),
  exit_time: z.string().or(z.date()).nullable().optional(),
  profit: z.number().nullable().optional(),
  status: z.enum(['open', 'closed', 'canceled']),
  is_public: z.boolean().default(false).optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

// 型エイリアス（簡潔な使用のため）
export type EntrySchema = z.infer<typeof entrySchema>;

// ページネーション結果の型
export interface PaginatedEntries {
  data: Entry[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ページネーションパラメータの型
export interface PaginationParams {
  page: number;
  pageSize: number;
  status?: 'open' | 'closed' | 'canceled';
  symbol?: string;
  userId?: string;
  isPublicOnly?: boolean;
}

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
  const supabase = createClient();
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

// 60秒間キャッシュするオープンエントリー取得関数
export const getOpenEntries = unstable_cache(
  async (isPublicOnly = false): Promise<Entry[]> => {
    return getEntriesByStatus('open', 50, 0, isPublicOnly);
  },
  ['open-entries'],
  { revalidate: 60 }
);

// 60秒間キャッシュするクローズドエントリー取得関数
export const getClosedEntries = unstable_cache(
  async (isPublicOnly = false): Promise<Entry[]> => {
    return getEntriesByStatus('closed', 50, 0, isPublicOnly);
  },
  ['closed-entries'],
  { revalidate: 60 }
);

/**
 * ページネーション付きでエントリーを取得
 * @param params ページネーションパラメータ
 * @returns ページネーション結果
 */
export const getEntriesPaginated = async (
  params: PaginationParams
): Promise<PaginatedEntries> => {
  const { 
    page = 1, 
    pageSize = 10, 
    status, 
    symbol, 
    userId, 
    isPublicOnly = false 
  } = params;
  
  const supabase = createClient();
  const offset = (page - 1) * pageSize;
  
  // クエリ構築
  let query = supabase
    .from('entries')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
  
  // フィルタ適用
  if (status) {
    query = query.eq('status', status);
  }
  
  if (symbol) {
    query = query.eq('symbol', symbol);
  }
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  if (isPublicOnly) {
    query = query.eq('is_public', true);
  }
  
  // レンジを適用
  query = query.range(offset, offset + pageSize - 1);
  
  // データ取得
  const { data, error, count } = await query;
  
  if (error) {
    throw error;
  }
  
  return {
    data: data || [],
    totalCount: count || 0,
    page,
    pageSize,
    hasMore: (count || 0) > offset + pageSize
  };
};

// 30秒間キャッシュするページネーション付きエントリー取得関数
export const getCachedEntriesPaginated = unstable_cache(
  async (params: PaginationParams): Promise<PaginatedEntries> => {
    return getEntriesPaginated(params);
  },
  ['paginated-entries'],
  { revalidate: 30 }
);

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
  const supabase = createClient();
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
  const supabase = createClient();
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
  const supabase = createClient();
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
  const supabase = createClient();
  const entryData: EntryInsert = {
    user_id: userId,
    side,
    symbol,
    price,
    time: time.toISOString(),
    take_profit: takeProfit || null,
    stop_loss: stopLoss || null,
    status: 'open',
    is_public: isPublic,
  };

  const { data, error } = await supabase
    .from('entries')
    .insert([entryData])
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
  updates: EntryUpdateParams
): Promise<Entry> => {
  const supabase = createClient();
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
  const supabase = createClient();
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
  const supabase = createClient();
  // まずエントリーを取得して利益を計算
  const { data: entry, error: fetchError } = await supabase
    .from('entries')
    .select('*')
    .eq('id', entryId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  if (!entry) {
    throw new Error(`Entry with ID ${entryId} not found`);
  }

  // 利益計算
  const profitValue = entry.side === 'buy'
    ? exitPrice - entry.price
    : entry.price - exitPrice;

  // エントリー更新
  const updates: EntryUpdateParams = {
    exit_price: exitPrice,
    exit_time: exitTime.toISOString(),
    profit: profitValue,
    status: 'closed',
  };

  return updateEntry(entryId, updates);
};

/**
 * エントリーをキャンセル
 * @param entryId エントリーID
 * @returns 更新されたエントリー
 */
export const cancelEntry = async (entryId: string): Promise<Entry> => {
  const updates: EntryUpdateParams = {
    status: 'canceled',
  };

  return updateEntry(entryId, updates);
};

/**
 * エントリーの更新をリアルタイムに購読
 * @param callback コールバック関数
 * @param isPublicOnly 公開エントリーのみ対象とするかどうか
 * @returns 購読解除関数
 */
export const subscribeToEntries = (
  callback: (entry: Entry) => void,
  isPublicOnly = false
) => {
  const supabase = createClient();
  
  const subscription = supabase
    .channel('entries-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'entries',
        ...(isPublicOnly ? { filter: 'is_public=eq.true' } : {})
      },
      (payload) => {
        callback(payload.new as Entry);
      }
    )
    .subscribe();

  // 購読解除関数を返す
  return () => {
    subscription.unsubscribe();
  };
};

/**
 * エントリーをIDで取得
 * @param entryId エントリーID
 * @returns エントリー
 */
export const getEntryById = async (entryId: string): Promise<Entry | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', entryId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // Not found
      return null;
    }
    throw error;
  }

  return data;
}; 