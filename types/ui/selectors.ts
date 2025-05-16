/**
 * UI関連のセレクター
 * 
 * 作成: UIスライスのセレクター定義
 * 更新: T-7.2フェーズ - インポートパスを修正
 * 更新: 2025-10-13 - S-12: TabType型のインポートパスを修正
 */

import { createSelector } from 'reselect'
import type { UIState, TabType } from '@/types/store/ui'

// UIState のセレクター
export const selectActiveTab = (state: UIState) => state.activeTab
export const selectIsDarkMode = (state: UIState) => state.isDarkMode
export const selectIsSidebarOpen = (state: UIState) => state.isSidebarOpen

// UIスライスを取得するセレクター
export const selectUI = (state: { ui: UIState }): UIState => state.ui

// メモ化されたセレクター
export const selectHasModal = createSelector(
  [selectIsDarkMode],
  // ダークモードの状態を返す（モーダルの状態は現在使用されていないため）
  (isDarkMode) => isDarkMode
)

export const selectThemeClass = createSelector(
  [selectIsDarkMode],
  (isDarkMode) => isDarkMode ? 'dark-theme' : 'light-theme'
)

export const selectLayoutClass = createSelector(
  [selectIsSidebarOpen],
  (isSidebarOpen) => isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'
)

// タブの選択状態を確認するためのセレクター
export const selectIsChartTabActive = createSelector(
  [selectActiveTab],
  (activeTab) => activeTab === 'chart'
)

export const selectIsOrderbookTabActive = createSelector(
  [selectActiveTab],
  (activeTab) => activeTab === 'orderbook'
)

export const selectIsTradesTabActive = createSelector(
  [selectActiveTab],
  (activeTab) => activeTab === 'trades'
)

export const selectIsPositionsTabActive = createSelector(
  [selectActiveTab],
  (activeTab) => activeTab === 'positions'
)

export const selectIsSettingsTabActive = createSelector(
  [selectActiveTab],
  (activeTab) => activeTab === 'settings'
) 