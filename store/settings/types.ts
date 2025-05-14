// store/settings/types.ts
// 設定ストアの型定義
// 作成日: 2025/6/2
// 更新日: 2025/6/X - 設定ストアのリファクタリング
// 更新日: 2025/6/15 - Supabase型との互換性を強化

import { Json } from '@/types/network/supabase';

/**
 * 設定の型定義
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

export interface SymbolSettings {
  id?: string;
  user_id?: string;
  symbol: string;
  is_favorite: boolean | null;
  display_order: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

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

// アクションの型定義
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

// 完全な設定スライスの型
export type SettingsSlice = SettingsState & SettingsActions; 