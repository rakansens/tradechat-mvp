// store/chart/drawingTool/index.ts
// 作成: DrawingToolSliceの統合とエクスポート

import { DrawingToolSliceState, initialDrawingToolState } from './state'
import { DrawingToolActions, DrawingToolSlice, createDrawingToolActions } from './actions'

/**
 * DrawingToolSliceを作成する関数
 * 状態とアクションを統合してスライスを作成します
 */
export const createDrawingToolSlice = <T extends DrawingToolSlice>(
  set: (state: Partial<T>) => void,
  get: () => T
): DrawingToolSlice => {
  return {
    // 初期状態
    ...initialDrawingToolState,
    
    // アクション
    ...createDrawingToolActions(set, get)
  }
}

// 型をエクスポート
export type { DrawingToolSlice, DrawingToolActions, DrawingToolSliceState } 