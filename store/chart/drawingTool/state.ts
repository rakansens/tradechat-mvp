// store/chart/drawingTool/state.ts
// 作成: DrawingToolSliceの状態定義

import type { DrawingToolType } from "@/types/store"

/**
 * 描画ツールスライスの状態型定義
 */
export interface DrawingToolSliceState {
  activeDrawingTools: DrawingToolType[]
}

/**
 * 描画ツールスライスの初期状態
 */
export const initialDrawingToolState: DrawingToolSliceState = {
  activeDrawingTools: [] // 初期状態では描画ツールは選択されていない
} 