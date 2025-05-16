// store/chart/drawingTool/selectors.ts
// 作成: DrawingToolSliceのセレクター定義
// 更新: 2025-10-08 - S-5フェーズ: 型参照パスとプロパティ名を修正

import { createSelector } from 'reselect'
import type { DrawingToolSlice } from './types'

/**
 * アクティブな描画ツールを選択するセレクター
 */
export const selectActiveDrawingTool = (state: DrawingToolSlice) => state.activeDrawingTool

/**
 * 描画ツールが有効かどうかを判定するメモ化セレクター
 * （特定のツールが選択されているかどうかをチェック）
 */
export const selectIsToolActive = createSelector(
  [selectActiveDrawingTool, (_: DrawingToolSlice, toolType: string) => toolType],
  (activeTool, toolType) => activeTool === toolType
) 