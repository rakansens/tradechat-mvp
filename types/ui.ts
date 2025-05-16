/**
 * @deprecated このファイルはT-4フェーズで非推奨となりました。代わりに types/ui/base.ts を使用してください。
 * 後方互換性のために保持されていますが、今後は types/ui からインポートすることを推奨します。
 */

// types/ui.ts
// 作成: UI関連の型定義
// 更新: T-7.5フェーズ - インポートパスを修正

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
 * 注意: このインターフェースは非推奨です。代わりに types/store/ui.ts の UIState を使用してください。
 * @deprecated Use UIState from types/store/ui.ts instead
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

// store/ui.ts からUIStateとTabTypeをエクスポート
export type { UIState } from '@/types/store/ui';
export type { TabType } from '@/types/store/ui';

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
