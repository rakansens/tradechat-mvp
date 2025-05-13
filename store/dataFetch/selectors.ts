// store/dataFetch/selectors.ts
// 作成: 2025-05-30 - dataFetchのスライス化に伴うセレクター定義
// 役割: DataFetchスライスの状態を選択するためのセレクター関数を提供

import { createMemoSelector } from '@/store/core/selectors';
import type { RootStore } from '@/store/rootStore';
import { ActiveFetch } from './state';

// 基本セレクター: アクティブなフェッチ一覧を取得
export const selectActiveFetches = (state: RootStore): ActiveFetch[] => 
  state.activeFetches;

// メモ化セレクター: アクティブフェッチの情報（タイムスタンプ付き）を取得
export const selectActiveFetchesInfo = createMemoSelector<RootStore, (ActiveFetch & { duration: number })[]>(
  (state) => state.getActiveFetchesInfo()
);

// タイプ別フェッチをフィルタリングするセレクター
export const selectActiveFetchesByType = (type: 'orderbook' | 'chart' | 'trades') => 
  createMemoSelector<RootStore, ActiveFetch[]>(
    (state) => state.activeFetches.filter((fetch: ActiveFetch) => fetch.type === type)
  ); 