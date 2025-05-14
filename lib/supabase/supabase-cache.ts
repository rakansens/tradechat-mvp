// lib/supabase-cache.ts
// Supabaseキャッシュデータ関連ユーティリティ関数
// 作成日: 2025/5/7
// 更新日: 2025/5/14 - 型参照を最新の型定義に更新し、型安全性を強化

import { supabase } from './supabase';
import { Tables, TablesInsert, TablesUpdate, Json } from '@/types/network/supabase';

// キャッシュ関連の型定義
type CachedData = Tables<'cached_data'>;
type CachedDataInsert = TablesInsert<'cached_data'>;
type CachedDataUpdate = TablesUpdate<'cached_data'>;

/**
 * キャッシュデータを取得
 * @param dataType データタイプ
 * @param symbol シンボル
 * @param timeframe タイムフレーム
 * @returns キャッシュデータ
 */
export const getCachedData = async (
  dataType: string,
  symbol: string,
  timeframe?: string
): Promise<CachedData | null> => {
  let query = supabase
    .from('cached_data')
    .select('*')
    .eq('data_type', dataType)
    .eq('symbol', symbol)
    .gt('expires_at', new Date().toISOString());

  if (timeframe) {
    query = query.eq('timeframe', timeframe);
  } else {
    query = query.is('timeframe', null);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * キャッシュデータを保存
 * @param dataType データタイプ
 * @param symbol シンボル
 * @param data データ
 * @param expiresIn 有効期限（秒）
 * @param timeframe タイムフレーム
 * @returns 保存されたキャッシュデータ
 */
export const setCachedData = async (
  dataType: string,
  symbol: string,
  data: Json,
  expiresIn = 300, // デフォルト5分
  timeframe?: string
): Promise<CachedData> => {
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

  // 既存のキャッシュを検索
  let query = supabase
    .from('cached_data')
    .select('id')
    .eq('data_type', dataType)
    .eq('symbol', symbol);

  if (timeframe) {
    query = query.eq('timeframe', timeframe);
  } else {
    query = query.is('timeframe', null);
  }

  const { data: existingData, error: searchError } = await query.maybeSingle();

  if (searchError) {
    throw searchError;
  }

  if (existingData) {
    // 既存のキャッシュを更新
    const updateData: CachedDataUpdate = {
      data,
      expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: updatedData, error: updateError } = await supabase
      .from('cached_data')
      .update(updateData)
      .eq('id', existingData.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return updatedData;
  } else {
    // 新しいキャッシュを作成
    const newCacheData: CachedDataInsert = {
      data_type: dataType,
      symbol,
      timeframe: timeframe || null,
      data,
      expires_at: expiresAt.toISOString(),
    };

    const { data: newData, error: insertError } = await supabase
      .from('cached_data')
      .insert([newCacheData])
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return newData;
  }
};

/**
 * キャッシュデータを削除
 * @param dataType データタイプ
 * @param symbol シンボル
 * @param timeframe タイムフレーム
 * @returns 削除結果
 */
export const deleteCachedData = async (
  dataType: string,
  symbol: string,
  timeframe?: string
): Promise<boolean> => {
  let query = supabase
    .from('cached_data')
    .delete()
    .eq('data_type', dataType)
    .eq('symbol', symbol);

  if (timeframe) {
    query = query.eq('timeframe', timeframe);
  } else {
    query = query.is('timeframe', null);
  }

  const { error } = await query;

  if (error) {
    throw error;
  }

  return true;
};

/**
 * 期限切れのキャッシュデータを削除
 * @returns 削除結果
 */
export const cleanupExpiredCache = async (): Promise<boolean> => {
  const { error } = await supabase
    .from('cached_data')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) {
    throw error;
  }

  return true;
};

/**
 * キャッシュデータを使用した関数
 * キャッシュがある場合はキャッシュを返し、なければfetchFnを実行して結果をキャッシュする
 * @param dataType データタイプ
 * @param symbol シンボル
 * @param fetchFn データ取得関数
 * @param expiresIn 有効期限（秒）
 * @param timeframe タイムフレーム
 * @returns 取得したデータ
 */
export const withCache = async <T extends Json>(
  dataType: string,
  symbol: string,
  fetchFn: () => Promise<T>,
  expiresIn = 300,
  timeframe?: string
): Promise<T> => {
  try {
    // キャッシュを確認
    const cachedData = await getCachedData(dataType, symbol, timeframe);
    
    if (cachedData) {
      return cachedData.data as T;
    }
  } catch (error) {
    console.error('キャッシュ取得エラー:', error);
    // キャッシュエラーは無視して続行
  }

  // キャッシュがない場合はデータを取得
  const data = await fetchFn();
  
  try {
    // 取得したデータをキャッシュ
    await setCachedData(dataType, symbol, data, expiresIn, timeframe);
  } catch (error) {
    console.error('キャッシュ保存エラー:', error);
    // キャッシュエラーは無視して続行
  }
  
  return data;
};

/**
 * 複数のキャッシュデータを取得
 * @param dataType データタイプ
 * @param symbols シンボル配列
 * @param timeframe タイムフレーム
 * @returns キャッシュデータ配列
 */
export const getBulkCachedData = async (
  dataType: string,
  symbols: string[],
  timeframe?: string
): Promise<Record<string, CachedData | null>> => {
  if (symbols.length === 0) {
    return {};
  }

  let query = supabase
    .from('cached_data')
    .select('*')
    .eq('data_type', dataType)
    .in('symbol', symbols)
    .gt('expires_at', new Date().toISOString());

  if (timeframe) {
    query = query.eq('timeframe', timeframe);
  } else {
    query = query.is('timeframe', null);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // シンボルごとにマップを作成
  const result: Record<string, CachedData | null> = {};
  
  // 初期化
  symbols.forEach(symbol => {
    result[symbol] = null;
  });
  
  // 取得したデータをマップに設定
  if (data) {
    data.forEach(item => {
      result[item.symbol] = item;
    });
  }
  
  return result;
};