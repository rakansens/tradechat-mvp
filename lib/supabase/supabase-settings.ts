// lib/supabase-settings.ts
// Supabase設定関連ユーティリティ関数
// 更新日: 2025/5/14 - 型参照を最新の型定義に更新し、型安全性を強化

import { supabase } from './supabase';
import { Tables, TablesInsert, TablesUpdate, Json } from '@/types/network/supabase';

// 設定関連の型定義
type SymbolSettings = Tables<'symbol_settings'>;
type SymbolSettingsInsert = TablesInsert<'symbol_settings'>;
type SymbolSettingsUpdate = TablesUpdate<'symbol_settings'>;

type ChartSettings = Tables<'chart_settings'>;
type ChartSettingsInsert = TablesInsert<'chart_settings'>;
type ChartSettingsUpdate = TablesUpdate<'chart_settings'>;

type IndicatorSettings = Tables<'indicator_settings'>;
type IndicatorSettingsInsert = TablesInsert<'indicator_settings'>;
type IndicatorSettingsUpdate = TablesUpdate<'indicator_settings'>;

/**
 * シンボル設定一覧を取得
 * @param userId ユーザーID
 * @returns シンボル設定一覧
 */
export const getSymbolSettings = async (userId: string): Promise<SymbolSettings[]> => {
  const { data, error } = await supabase
    .from('symbol_settings')
    .select('*')
    .eq('user_id', userId)
    .order('display_order', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * お気に入りシンボル一覧を取得
 * @param userId ユーザーID
 * @returns お気に入りシンボル一覧
 */
export const getFavoriteSymbols = async (userId: string): Promise<SymbolSettings[]> => {
  const { data, error } = await supabase
    .from('symbol_settings')
    .select('*')
    .eq('user_id', userId)
    .eq('is_favorite', true)
    .order('display_order', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * シンボル設定を作成または更新
 * @param userId ユーザーID
 * @param symbol シンボル
 * @param isFavorite お気に入りかどうか
 * @param displayOrder 表示順序
 * @returns 作成または更新されたシンボル設定
 */
export const upsertSymbolSettings = async (
  userId: string,
  symbol: string,
  isFavorite = false,
  displayOrder = 0
): Promise<SymbolSettings> => {
  const { data, error } = await supabase
    .from('symbol_settings')
    .upsert(
      {
        user_id: userId,
        symbol,
        is_favorite: isFavorite,
        display_order: displayOrder,
      },
      {
        onConflict: 'user_id,symbol',
      }
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * シンボル設定を削除
 * @param userId ユーザーID
 * @param symbol シンボル
 * @returns 削除結果
 */
export const deleteSymbolSettings = async (
  userId: string,
  symbol: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('symbol_settings')
    .delete()
    .eq('user_id', userId)
    .eq('symbol', symbol);

  if (error) {
    throw error;
  }

  return true;
};

/**
 * チャート設定一覧を取得
 * @param userId ユーザーID
 * @returns チャート設定一覧
 */
export const getChartSettings = async (userId: string): Promise<ChartSettings[]> => {
  const { data, error } = await supabase
    .from('chart_settings')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * チャート設定を作成
 * @param userId ユーザーID
 * @param timeframe タイムフレーム
 * @param chartType チャートタイプ
 * @param showVolume 出来高表示
 * @param showGrid グリッド表示
 * @param showLegend 凡例表示
 * @param theme テーマ
 * @returns 作成されたチャート設定
 */
export const createChartSettings = async (
  userId: string,
  timeframe: string,
  chartType: string,
  showVolume = true,
  showGrid = true,
  showLegend = true,
  theme = 'dark'
): Promise<ChartSettings> => {
  const { data, error } = await supabase
    .from('chart_settings')
    .insert([
      {
        user_id: userId,
        timeframe,
        chart_type: chartType,
        show_volume: showVolume,
        show_grid: showGrid,
        show_legend: showLegend,
        theme,
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
 * チャート設定を更新
 * @param chartSettingsId チャート設定ID
 * @param updates 更新内容
 * @returns 更新されたチャート設定
 */
export const updateChartSettings = async (
  chartSettingsId: string,
  updates: Partial<Omit<ChartSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<ChartSettings> => {
  const { data, error } = await supabase
    .from('chart_settings')
    .update(updates)
    .eq('id', chartSettingsId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * チャート設定を削除
 * @param chartSettingsId チャート設定ID
 * @returns 削除結果
 */
export const deleteChartSettings = async (chartSettingsId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('chart_settings')
    .delete()
    .eq('id', chartSettingsId);

  if (error) {
    throw error;
  }

  return true;
};

/**
 * インジケーター設定一覧を取得
 * @param chartSettingsId チャート設定ID
 * @returns インジケーター設定一覧
 */
export const getIndicatorSettings = async (
  chartSettingsId: string
): Promise<IndicatorSettings[]> => {
  const { data, error } = await supabase
    .from('indicator_settings')
    .select('*')
    .eq('chart_settings_id', chartSettingsId);

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * インジケーター設定を作成
 * @param userId ユーザーID
 * @param chartSettingsId チャート設定ID
 * @param type インジケータータイプ
 * @param params パラメーター
 * @param color 色
 * @param visible 表示するかどうか
 * @returns 作成されたインジケーター設定
 */
export const createIndicatorSettings = async (
  userId: string,
  chartSettingsId: string,
  type: string,
  params: Record<string, any> = {},
  color?: string,
  visible = true
): Promise<IndicatorSettings> => {
  const { data, error } = await supabase
    .from('indicator_settings')
    .insert([
      {
        user_id: userId,
        chart_settings_id: chartSettingsId,
        type,
        params,
        color,
        visible,
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
 * インジケーター設定を更新
 * @param indicatorSettingsId インジケーター設定ID
 * @param updates 更新内容
 * @returns 更新されたインジケーター設定
 */
export const updateIndicatorSettings = async (
  indicatorSettingsId: string,
  updates: Partial<Omit<IndicatorSettings, 'id' | 'user_id' | 'chart_settings_id' | 'created_at' | 'updated_at'>>
): Promise<IndicatorSettings> => {
  const { data, error } = await supabase
    .from('indicator_settings')
    .update(updates)
    .eq('id', indicatorSettingsId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * インジケーター設定を削除
 * @param indicatorSettingsId インジケーター設定ID
 * @returns 削除結果
 */
export const deleteIndicatorSettings = async (
  indicatorSettingsId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('indicator_settings')
    .delete()
    .eq('id', indicatorSettingsId);

  if (error) {
    throw error;
  }

  return true;
};

/**
 * ユーザー設定を取得
 * @param userId ユーザーID
 * @returns ユーザー設定
 */
export const getUserSettings = async (userId: string): Promise<Json | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('settings')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // レコードが見つからない場合
      return null;
    }
    throw error;
  }

  return data?.settings;
};

/**
 * ユーザー設定を更新
 * @param userId ユーザーID
 * @param settings 設定内容
 * @returns 更新結果
 */
export const updateUserSettings = async (
  userId: string,
  settings: Json
): Promise<boolean> => {
  const { error } = await supabase
    .from('users')
    .update({ settings })
    .eq('id', userId);

  if (error) {
    throw error;
  }

  return true;
};