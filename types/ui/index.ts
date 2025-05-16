/**
 * UI関連の型定義をエクスポートするバレルファイル
 * 
 * このファイルはUIコンポーネントとインタラクションに関連する型定義をエクスポートします。
 * T-4フェーズでtypes/ui.tsから移動されました。
 * 更新: T-7.5フェーズ - インポートパスを修正
 */

// UI基本型定義をエクスポート
export * from './base';

// Storeからの型定義を再エクスポート
export type { UIState } from '@/types/store/ui';
export type { TabType } from '@/types/store/ui';

// T-4で実装予定
// export * from './modal';
// export * from './theme';
// export * from './layout'; 