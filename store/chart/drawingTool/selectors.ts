// store/chart/drawingTool/selectors.ts
// 作成: DrawingToolSliceのセレクター定義

import { createSelector } from 'reselect'
import type { DrawingToolSlice } from './actions'

/**
 * アクティブな描画ツールを選択するセレクター
 */
export const selectActiveDrawingTools = (state: DrawingToolSlice) => state.activeDrawingTools

/**
 * 描画ツールが有効かどうかを判定するメモ化セレクター
 * （特定のツールが選択されているかどうかをチェック）
 */
export const selectIsToolActive = createSelector(
  [selectActiveDrawingTools, (_: DrawingToolSlice, toolType: string) => toolType],
  (tools, toolType) => tools.includes(toolType as any)
) 