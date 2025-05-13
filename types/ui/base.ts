/**
 * UI関連の基本型定義
 * 
 * このファイルはUIコンポーネントとインタラクションに関連する型定義を集約しています。
 * T-4フェーズでtypes/ui.tsから移動されました。
 */

/**
 * アプリケーションのタブ
 */
export type AppTab = "chart" | "chat" | "entries" | "settings";

/**
 * テーマの種類
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * UIの状態型
 *
 * 注意: このインターフェースは非推奨です。代わりに types/store.ts の UIState を使用してください。
 * @deprecated Use UIState from types/store.ts instead
 */
export interface UIStateDeprecated {
  // 状態
  activeTab: AppTab;
  themeMode?: ThemeMode;
  isSidebarOpen?: boolean;
  isSettingsOpen?: boolean;

  // アクション
  setActiveTab: (tab: AppTab) => void;
  setThemeMode?: (mode: ThemeMode) => void;
  toggleSidebar?: () => void;
  toggleSettings?: () => void;
}

// 注: store.tsの再エクスポートはindex.tsで行います

/**
 * レスポンシブ表示のブレークポイント
 */
export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * モーダルの種類
 */
export type ModalType = "entry" | "exit" | "settings" | "alert" | "confirm";

/**
 * モーダルの状態
 */
export interface ModalState {
  isOpen: boolean;
  type: ModalType;
  data?: any; // モーダルに渡すデータ
} 