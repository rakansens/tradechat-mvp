// store/settings/selectors.ts
// 設定ストア用のセレクター
// 作成日: 2025/6/X - 設定ストアのリファクタリング

import { createSelector } from 'reselect';
import type { SettingsState } from './types';
import type { SettingsActions } from './types';
import type { ChartSettings, SymbolSettings, UserSettings } from './types';

// 完全なスライス型を使用するためのインポート回避型定義
type SettingsSlice = SettingsState & SettingsActions;

// 基本セレクター（状態のみ）
export const selectUserSettings = (state: SettingsState): UserSettings | null => state.userSettings;
export const selectChartSettings = (state: SettingsState): ChartSettings[] | null => state.chartSettings;
export const selectSymbolSettings = (state: SettingsState): SymbolSettings[] | null => state.symbolSettings;
export const selectIsLoading = (state: SettingsState): boolean => state.isLoading;
export const selectError = (state: SettingsState): string | null => state.error;

// アクションセレクタ（完全なスライス型を使用）
export const selectFetchUserSettings = (state: SettingsSlice) => state.fetchUserSettings;
export const selectFetchChartSettings = (state: SettingsSlice) => state.fetchChartSettings;
export const selectFetchSymbolSettings = (state: SettingsSlice) => state.fetchSymbolSettings;
export const selectUpdateUserSettings = (state: SettingsSlice) => state.updateUserSettings;
export const selectUpdateChartSettings = (state: SettingsSlice) => state.updateChartSettings;
export const selectUpdateSymbolSettings = (state: SettingsSlice) => state.updateSymbolSettings;
export const selectCreateChartSettings = (state: SettingsSlice) => state.createChartSettings;
export const selectCreateSymbolSettings = (state: SettingsSlice) => state.createSymbolSettings;

// メモ化されたセレクター
export const selectFavoriteSymbols = createSelector(
  [selectSymbolSettings],
  (symbolSettings): SymbolSettings[] | null => {
    if (!symbolSettings) return null;
    return symbolSettings.filter(s => s.is_favorite);
  }
);

export const selectSymbolsByOrder = createSelector(
  [selectSymbolSettings],
  (symbolSettings): SymbolSettings[] | null => {
    if (!symbolSettings) return null;
    return [...symbolSettings].sort((a, b) => a.display_order - b.display_order);
  }
);

export const selectChartSettingById = (id: string) => 
  createSelector(
    [selectChartSettings],
    (chartSettings): ChartSettings | null => {
      if (!chartSettings) return null;
      const setting = chartSettings.find(s => s.id === id);
      return setting || null;
    }
  );

export const selectSymbolSettingBySymbol = (symbol: string) => 
  createSelector(
    [selectSymbolSettings],
    (symbolSettings): SymbolSettings | null => {
      if (!symbolSettings) return null;
      const setting = symbolSettings.find(s => s.symbol === symbol);
      return setting || null;
    }
  ); 