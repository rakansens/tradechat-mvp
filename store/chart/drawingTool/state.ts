// store/chart/drawingTool/state.ts
// 作成: DrawingToolSliceの状態定義
// 更新: T-7.5フェーズ - 型インポートパスを修正
// 更新: 2025-10-06 - 型定義をtypes.tsに移動し、状態構造を更新
// 更新: 2025-10-10 - 状態型を再エクスポートして型参照問題を解消

import { type DrawingToolSliceState } from './types';

/**
 * 描画ツールスライスの初期状態
 */
export const initialDrawingToolState: DrawingToolSliceState = {
  activeDrawingTool: null,   // 初期状態では描画ツールは選択されていない
  isDrawingActive: false,    // 初期状態では描画モードは無効
  drawingData: null          // 初期状態では描画データは存在しない
}; 

// 描画ツールスライスの状態型を再エクスポート（型参照問題解消のため）
export type { DrawingToolSliceState }; 