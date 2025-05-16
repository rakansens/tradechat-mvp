/**
 * @deprecated このファイルはT-4フェーズで非推奨となりました。代わりに types/ui/base.ts を使用してください。
 * 後方互換性のために保持されていますが、今後は types/ui からインポートすることを推奨します。
 * 
 * 更新：T-7.5フェーズ - 循環参照を防ぐためimportを修正
 */

/**
 * types/ui.ts
 * 
 * UI関連の型定義を再エクスポートするファイル
 * 
 * 更新: T-7.5フェーズ - 循環参照解消のため修正
 */

// ストアのUIState型とTabType型を明示的に再エクスポート
export type { UIState, TabType } from './store/ui';

/**
 * @deprecated このファイルの直接利用は推奨されません。
 * 代わりに次のインポートパスを使用してください：
 * 
 * - UIState, TabType: import { UIState, TabType } from '@/types/store/ui';
 * - その他UI関連の型: import { ... } from '@/types/ui/base';
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
