// lib/supabase/features/settings.ts
// Supabase設定関連ユーティリティ関数（SSR対応版）
// 作成日: 2025/5/14 - 初期実装
// 更新日: 2025/5/14 - 型参照を最新の型定義に更新し、型安全性を強化
// 更新日: 2025/6/20 - SSRクライアント対応
// 更新日: 2023/7/5 - Dependency Injection パターンに更新 (supabaseClient ?? createClient())

import { createClient } from '@/lib/supabase/client';
import { Tables, TablesInsert, TablesUpdate, Json } from '@/types/network/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

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
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns シンボル設定一覧
 */
export const getSymbolSettings = async (
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<SymbolSettings[]> => {
  const supabase = supabaseClient ?? createClient();
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
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns お気に入りシンボル一覧
 */
export const getFavoriteSymbols = async (
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<SymbolSettings[]> => {
  const supabase = supabaseClient ?? createClient();
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
 * @param favorite お気に入りかどうか
 * @param displayOrder 表示順序
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns 作成または更新されたシンボル設定
 */
export const upsertSymbolSettings = async (
  userId: string,
  symbol: string,
  favorite: boolean | undefined = false,
  displayOrder: number | undefined = 0,
  supabaseClient?: SupabaseClient
): Promise<SymbolSettings> => {
  const supabase = supabaseClient ?? createClient();
  const { data, error } = await supabase
    .from('symbol_settings')
    .upsert(
      {
        user_id: userId,
        symbol,
        is_favorite: favorite,
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
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns 削除結果
 */
export const deleteSymbolSettings = async (
  userId: string,
  symbol: string,
  supabaseClient?: SupabaseClient
): Promise<boolean> => {
  const supabase = supabaseClient ?? createClient();
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
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns チャート設定一覧
 */
export const getChartSettings = async (
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<ChartSettings[]> => {
  const supabase = supabaseClient ?? createClient();
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
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns 作成されたチャート設定
 */
export const createChartSettings = async (
  userId: string,
  timeframe: string,
  chartType: string,
  showVolume: boolean | undefined = true,
  showGrid: boolean | undefined = true,
  showLegend: boolean | undefined = true,
  theme: string | undefined = 'dark',
  supabaseClient?: SupabaseClient
): Promise<ChartSettings> => {
  const supabase = supabaseClient ?? createClient();
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
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns 更新されたチャート設定
 */
export const updateChartSettings = async (
  chartSettingsId: string,
  updates: Partial<Omit<ChartSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
  supabaseClient?: SupabaseClient
): Promise<ChartSettings> => {
  const supabase = supabaseClient ?? createClient();
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
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns 削除結果
 */
export const deleteChartSettings = async (
  chartSettingsId: string,
  supabaseClient?: SupabaseClient
): Promise<boolean> => {
  const supabase = supabaseClient ?? createClient();
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
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns インジケーター設定一覧
 */
export const getIndicatorSettings = async (
  chartSettingsId: string,
  supabaseClient?: SupabaseClient
): Promise<IndicatorSettings[]> => {
  const supabase = supabaseClient ?? createClient();
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
 * @param params パラメータ
 * @param color 色
 * @param visible 表示フラグ
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns 作成されたインジケーター設定
 */
export const createIndicatorSettings = async (
  userId: string,
  chartSettingsId: string,
  type: string,
  params: Record<string, any> = {},
  color?: string,
  visible = true,
  supabaseClient?: SupabaseClient
): Promise<IndicatorSettings> => {
  const supabase = supabaseClient ?? createClient();
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
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns 更新されたインジケーター設定
 */
export const updateIndicatorSettings = async (
  indicatorSettingsId: string,
  updates: Partial<Omit<IndicatorSettings, 'id' | 'user_id' | 'chart_settings_id' | 'created_at' | 'updated_at'>>,
  supabaseClient?: SupabaseClient
): Promise<IndicatorSettings> => {
  const supabase = supabaseClient ?? createClient();
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
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns 削除結果
 */
export const deleteIndicatorSettings = async (
  indicatorSettingsId: string,
  supabaseClient?: SupabaseClient
): Promise<boolean> => {
  const supabase = supabaseClient ?? createClient();
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
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns ユーザー設定
 */
export const getUserSettings = async (
  userId: string,
  supabaseClient?: SupabaseClient
): Promise<Json | null> => {
  const supabase = supabaseClient ?? createClient();
  // profilesテーブルのmetadataカラムからsettingsを取得
  const { data, error } = await supabase
    .from('profiles')
    .select('metadata')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // レコードが見つからない場合は null を返す
      return null;
    }
    throw error;
  }

  const metadata = data?.metadata as Record<string, any> | null;
  return metadata?.settings ?? null;
};

/**
 * ユーザー設定を更新
 * @param userId ユーザーID
 * @param settings 設定
 * @param supabaseClient Supabaseクライアントインスタンス（オプション）
 * @returns 更新結果
 */
export const updateUserSettings = async (
  userId: string,
  settings: Json,
  supabaseClient?: SupabaseClient
): Promise<boolean> => {
  const supabase = supabaseClient ?? createClient();

  // 現在のmetadataを取得してsettingsをマージ
  const { data: current, error: fetchError } = await supabase
    .from('profiles')
    .select('metadata')
    .eq('user_id', userId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  const currentMetadata = (current?.metadata as Record<string, any>) || {};
  const newMetadata = { ...currentMetadata, settings };

  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        metadata: newMetadata,
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return true;
}; 