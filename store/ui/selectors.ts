// store/ui/selectors.ts
// 作成: UIストア用のメモ化されたセレクター関数
// 更新: 基本セレクタを追加し、一貫したセレクタパターンを適用
// 
// このファイルはZustandストアのパフォーマンスを向上させるためのメモ化されたセレクター関数を提供します。

import { createSelector } from 'reselect';
import type { UIState, TabType } from '@/types/store';

// 基本セレクター
export const selectActiveTab = (state: UIState) => state.activeTab;
export const selectIsDarkMode = (state: UIState) => state.isDarkMode;
export const selectIsSidebarOpen = (state: UIState) => state.isSidebarOpen;

// メモ化されたセレクター
export const selectIsChartTabActive = createSelector(
  [selectActiveTab],
  (activeTab: TabType): boolean => {
    return activeTab === 'chart';
  }
);

export const selectIsOrderbookTabActive = createSelector(
  [selectActiveTab],
  (activeTab: TabType): boolean => {
    return activeTab === 'orderbook';
  }
);

export const selectIsTradesTabActive = createSelector(
  [selectActiveTab],
  (activeTab: TabType): boolean => {
    return activeTab === 'trades';
  }
);

export const selectIsPositionsTabActive = createSelector(
  [selectActiveTab],
  (activeTab: TabType): boolean => {
    return activeTab === 'positions';
  }
);

export const selectIsSettingsTabActive = createSelector(
  [selectActiveTab],
  (activeTab: TabType): boolean => {
    return activeTab === 'settings';
  }
);

// テーマ関連のセレクター
export const selectThemeClass = createSelector(
  [selectIsDarkMode],
  (isDarkMode: boolean): string => {
    return isDarkMode ? 'dark' : 'light';
  }
);

// レイアウト関連のセレクター
export const selectLayoutClass = createSelector(
  [selectIsSidebarOpen],
  (isSidebarOpen: boolean): string => {
    return isSidebarOpen ? 'sidebar-open' : 'sidebar-closed';
  }
);
