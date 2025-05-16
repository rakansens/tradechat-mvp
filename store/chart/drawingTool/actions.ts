// store/chart/drawingTool/actions.ts
// 作成: DrawingToolSliceのアクション定義
// 更新: T-7.5フェーズ - 型インポートパスを修正
// 更新: 2025-10-06 - 型定義をtypes.tsに移動し、immerSetを使用するように更新

import { type DrawingToolType } from "@/types/store/chart"
import { type DrawingToolSliceActions, type DrawingToolSlice, type DrawingToolSliceState } from "./types"

/**
 * 描画ツールスライスのアクションを作成する関数
 */
export const createDrawingToolActions = (
  set: (fn: (state: DrawingToolSliceState) => void) => void,
  get: () => DrawingToolSlice
): DrawingToolSliceActions => ({
  // 描画ツールの有効/無効を切り替え
  toggleDrawingTool: (toolType) => {
    const currentTool = get().activeDrawingTool;
    
    // 同じツールが選択された場合は、描画モードのON/OFFを切り替え
    if (currentTool === toolType) {
      set(state => {
        state.isDrawingActive = !state.isDrawingActive;
      });
    } else {
      // 異なるツールが選択された場合は、新しいツールをアクティブにして描画モードをON
      set(state => {
        state.activeDrawingTool = toolType;
        state.isDrawingActive = true;
      });
    }
  },
  
  // 全ての描画ツールをクリア
  clearAllDrawingTools: () => {
    set(state => {
      state.activeDrawingTool = null;
      state.isDrawingActive = false;
      state.drawingData = null;
    });
  }
}); 