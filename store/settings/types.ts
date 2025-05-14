// store/settings/types.ts
// 設定ストアの型定義
// 作成日: 2025/6/2
// 更新日: 2025/6/X - 設定ストアのリファクタリング

/**
 * 設定の型定義
 */
export interface ChartSettings {
  id: string;
  timeframe: string;
  chart_type: string;
  show_volume: boolean;
  show_grid: boolean;
  show_legend: boolean;
  theme: string;
}

export interface SymbolSettings {
  symbol: string;
  is_favorite: boolean;
  display_order: number;
}

export type UserSettings = Record<string, any>;

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
  fetchUserSettings: () => Promise<void>;
  fetchChartSettings: () => Promise<void>;
  fetchSymbolSettings: () => Promise<void>;
  updateUserSettings: (settings: UserSettings) => Promise<void>;
  updateChartSettings: (settings: ChartSettings) => Promise<void>;
  updateSymbolSettings: (settings: SymbolSettings | SymbolSettings[]) => Promise<void>;
  createSymbolSettings: (settings: Omit<SymbolSettings, 'id'>) => Promise<void>;
  createChartSettings: (settings: Omit<ChartSettings, 'id'>) => Promise<void>;
}

// 完全な設定スライスの型
export type SettingsSlice = SettingsState & SettingsActions; 