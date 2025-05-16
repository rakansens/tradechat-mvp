// store/chart/indicator/index.ts
// 作成: IndicatorSliceの統合とエクスポート
// 更新: 2025-10-05 - 型定義をtypes.tsに移動し、SliceCreator型に準拠するように修正

import { initialIndicatorState } from './state';
import { createIndicatorActions } from './actions';
import { type IndicatorSlice, type IndicatorSliceState, type IndicatorSliceActions, type IndicatorSliceCreator } from './types';
import { createImmerSetter } from '@/store/core/immerSet';

/**
 * IndicatorSliceを作成する関数
 * 状態とアクションを統合してスライスを作成します
 */
export const createIndicatorSlice: IndicatorSliceCreator = (
  set,
  get
) => {
  // immerSetラッパーを作成
  const immerSet = createImmerSetter<IndicatorSliceState>(set);
  
  // 型安全なゲッター関数
  const getState = () => get() as IndicatorSlice;
  
  // アクションを作成
  const actions = createIndicatorActions(
    set,
    getState
  );
  
  // 状態とアクションを結合して返す
  return {
    // 初期状態
    ...initialIndicatorState,
    
    // アクション
    ...actions
  };
};

// 型をエクスポート
export type { IndicatorSlice, IndicatorSliceState, IndicatorSliceActions } from './types'; 