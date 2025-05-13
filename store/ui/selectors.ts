// store/ui/selectors.ts
// 作成: UIストア用のメモ化されたセレクター関数
// 更新: 基本セレクタを追加し、一貫したセレクタパターンを適用
// 更新: 型安全性の向上のため、UIState型を明示的に使用
// 更新: UIスライス構造に合わせたセレクターの修正
// 更新: 新しいセレクターを追加（モーダル、設定など）
// 更新: 循環参照を解消するために型定義を修正
//
// このファイルはZustandストアのパフォーマンスを向上させるためのメモ化されたセレクター関数を提供します。

import { createSelector } from 'reselect';
import type { TabType } from '@/types/store';
import type { UISliceState } from './state';
import type { UISliceActions } from './actions';

// 循環参照を避けるためにUISliceの型をここで定義
type UISlice = UISliceState & UISliceActions;

// 基本セレクター（状態のみ）
export const selectActiveTab = (state: UISliceState) => state.activeTab;
export const selectIsDarkMode = (state: UISliceState) => state.isDarkMode;
export const selectIsSidebarOpen = (state: UISliceState) => state.isSidebarOpen;
export const selectIsSettingsOpen = (state: UISliceState) => state.isSettingsOpen;
export const selectIsModalOpen = (state: UISliceState) => state.isModalOpen;
export const selectModalType = (state: UISliceState) => state.modalType;
export const selectModalData = (state: UISliceState) => state.modalData;

// アクションセレクター（完全なスライス型を使用）
export const selectSetActiveTab = (state: UISlice) => state.setActiveTab;
export const selectToggleDarkMode = (state: UISlice) => state.toggleDarkMode;
export const selectSetDarkMode = (state: UISlice) => state.setDarkMode;
export const selectToggleSidebar = (state: UISlice) => state.toggleSidebar;
export const selectSetSidebarOpen = (state: UISlice) => state.setSidebarOpen;
export const selectToggleSettings = (state: UISlice) => state.toggleSettings;
export const selectSetSettingsOpen = (state: UISlice) => state.setSettingsOpen;
export const selectOpenModal = (state: UISlice) => state.openModal;
export const selectCloseModal = (state: UISlice) => state.closeModal;

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

// モーダル関連のセレクター
export const selectHasModal = createSelector(
  [selectIsModalOpen, selectModalType],
  (isModalOpen: boolean, modalType: string | null): boolean => {
    return isModalOpen && modalType !== null;
  }
);

export const selectModalProps = createSelector(
  [selectIsModalOpen, selectModalType, selectModalData],
  (isModalOpen: boolean, modalType: string | null, modalData: any): { isOpen: boolean; type: string | null; data: any } => {
    return {
      isOpen: isModalOpen,
      type: modalType,
      data: modalData
    };
  }
);
