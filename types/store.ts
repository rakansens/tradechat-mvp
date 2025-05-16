// types/store.ts
// @deprecated このファイルはT-7フェーズで非推奨となりました。代わりに各ドメイン固有のファイルから直接インポートしてください。
// 例: import { ChartDataState } from '@/types/store/chart';
// このファイルはT-8フェーズで完全に削除される予定です。

// 更新: T-7フェーズでスタブファイルに変更
// 循環参照を避けるため、実装は移動しました。

// ストア固有の型定義
// 循環参照を避けるために最小限のみここで定義
export interface StoreFilterOptions {
  searchTerm: string;
  quoteAsset: string;
  favoritesOnly: boolean;
}

// 後方互換性のための型エイリアス
/**
 * フィルターオプションの型定義
 * @deprecated StoreFilterOptionsを使用してください
 */
export type FilterOptions = StoreFilterOptions;

/**
 * @deprecated 各型は下記の場所で定義されています:
 * - AppState: types/store/app
 * - ChartDataState, ChartConfigState, IndicatorState, DrawingToolState, RealTimeState: types/store/chart
 * - IndicatorType, ActiveIndicator, DrawingToolType: types/store/chart
 * - MarketState: types/store/market
 * - UIState, TabType: types/store/ui
 * 
 * 直接ドメイン固有のファイルからインポートしてください。
 * 例: import { AppState } from '@/types/store/app';
 */
