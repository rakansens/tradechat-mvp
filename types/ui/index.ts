/**
 * UI関連の型定義をエクスポートするバレルファイル
 * 
 * このファイルはUIコンポーネントとインタラクションに関連する型定義をエクスポートします。
 * T-4フェーズでtypes/ui.tsから移動されました。
 * 更新: T-7.5フェーズ - インポートパスを修正し、循環参照を解消
 */

// UI基本型定義をエクスポート
export * from './base';

// 注：循環参照を避けるため、以下は削除しました
// export type { UIState } from '@/types/store/ui';
// export type { TabType } from '@/types/store/ui';

// T-4で実装予定
// export * from './modal';
// export * from './theme';
// export * from './layout'; 