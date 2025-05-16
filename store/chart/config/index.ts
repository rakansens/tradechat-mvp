// store/chart/config/index.ts
// 作成: ChartConfigSliceの統合とエクスポート
// 更新: 2025-10-06 - 型定義をtypes.tsに移動し、immerSetを使用するように更新

import { initialChartConfigState } from './state';
import { createChartConfigActions } from './actions';
import { type ChartConfigSlice, type ChartConfigSliceState, type ChartConfigSliceActions, type ChartConfigSliceCreator } from './types';
import { createImmerSetter } from '@/store/core/immerSet';

/**
 * ChartConfigSliceを作成する関数
 * 状態とアクションを統合してスライスを作成します
 */
export const createChartConfigSlice: ChartConfigSliceCreator = (
  set,
  get
) => {
  // immerSetラッパーを作成
  const immerSet = createImmerSetter<ChartConfigSliceState>(set);
  
  // 型安全なゲッター関数
  const getState = () => get() as ChartConfigSlice;
  
  // アクションを作成
  const actions = createChartConfigActions(
    immerSet,
    getState
  );
  
  // 状態とアクションを結合して返す
  return {
    // 初期状態
    ...initialChartConfigState,
    
    // アクション
    ...actions
  };
};

// 型をエクスポート
export type { ChartConfigSlice, ChartConfigSliceState, ChartConfigSliceActions } from './types'; 