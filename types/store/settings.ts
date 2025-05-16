// types/store/settings.ts
// 作成: 2025-10-08 - S-3フェーズ: 設定スライス用の型定義ファイルを作成

import { Json } from '@/types/network/supabase';

/**
 * このファイルは設定ストアの型定義を提供します。
 * 型定義の二重化解消のため正規ルートとして定義されます。
 */

/**
 * チャート設定の型定義
 */
export interface ChartSettings {
  id: string;
  user_id: string;
  timeframe: string;
  chart_type: string;
  show_volume: boolean | null;
  show_grid: boolean | null;
  show_legend: boolean | null;
  theme: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * シンボル設定の型定義
 */
export interface SymbolSettings {
  id?: string;
  user_id?: string;
  symbol: string;
  is_favorite: boolean | null;
  display_order: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/**
 * ユーザー設定の型定義
 */
export type UserSettings = Json;

/**
 * 設定ストアの状態の型定義
 */
export interface SettingsState {
  // 状態
  userSettings: UserSettings | null;
  chartSettings: ChartSettings[] | null;
  symbolSettings: SymbolSettings[] | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * 設定ストアのアクション定義
 */
export interface SettingsActions {
  // アクション
  fetchUserSettings: () => Promise<UserSettings | null>;
  fetchChartSettings: () => Promise<ChartSettings[]>;
  fetchSymbolSettings: () => Promise<SymbolSettings[]>;
  updateUserSettings: (settings: UserSettings) => Promise<UserSettings>;
  updateChartSettings: (settings: ChartSettings) => Promise<ChartSettings>;
  updateSymbolSettings: (settings: SymbolSettings) => Promise<SymbolSettings>;
  createSymbolSettings: (settings: Omit<SymbolSettings, 'id'>) => Promise<SymbolSettings>;
  createChartSettings: (settings: Omit<ChartSettings, 'id'>) => Promise<ChartSettings>;
}

/**
 * 完全な設定スライスの型定義
 */
export type SettingsSlice = SettingsState & SettingsActions; 