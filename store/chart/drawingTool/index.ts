// store/chart/drawingTool/index.ts
// 作成: DrawingToolSliceの統合とエクスポート
// 更新: 2025-10-06 - 型定義をtypes.tsに移動し、immerSetを使用するように更新

import { initialDrawingToolState } from './state';
import { createDrawingToolActions } from './actions';
import { type DrawingToolSlice, type DrawingToolSliceState, type DrawingToolSliceActions, type DrawingToolSliceCreator } from './types';
import { createImmerSetter } from '@/store/core/immerSet';

/**
 * DrawingToolSliceを作成する関数
 * 状態とアクションを統合してスライスを作成します
 */
export const createDrawingToolSlice: DrawingToolSliceCreator = (
  set,
  get
) => {
  // immerSetラッパーを作成
  const immerSet = createImmerSetter<DrawingToolSliceState>(set);
  
  // 型安全なゲッター関数
  const getState = () => get() as DrawingToolSlice;
  
  // アクションを作成
  const actions = createDrawingToolActions(
    immerSet,
    getState
  );
  
  // 状態とアクションを結合して返す
  return {
    // 初期状態
    ...initialDrawingToolState,
    
    // アクション
    ...actions
  };
};

// 型をエクスポート
export type { DrawingToolSlice, DrawingToolSliceState, DrawingToolSliceActions } from './types'; 