// types/store/ui.ts
// UI関連のストア型定義

/**
 * タブの種類
 */
export type TabType = 'chart' | 'orderbook' | 'trades' | 'positions' | 'settings';

/**
 * UIストアの状態
 */
export interface UIState {
  // 状態
  activeTab: TabType;
  isDarkMode: boolean;
  isSidebarOpen: boolean;
  
  // アクション
  setActiveTab: (tab: TabType) => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
} 