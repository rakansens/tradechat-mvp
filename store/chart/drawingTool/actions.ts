// store/chart/drawingTool/actions.ts
// 作成: DrawingToolSliceのアクション定義

import type { DrawingToolType } from "@/types/store"
import type { DrawingToolSliceState } from "./state"

export interface DrawingToolActions {
  // 描画ツールの有効/無効を切り替えるアクション
  toggleDrawingTool: (tool: DrawingToolType) => void
  
  // 全ての描画ツールをクリアするアクション
  clearAllDrawingTools: () => void
}

export type DrawingToolSlice = DrawingToolSliceState & DrawingToolActions

/**
 * 描画ツールスライスのアクションを作成する関数
 */
export const createDrawingToolActions = <T extends DrawingToolSlice>(
  set: (state: Partial<T>) => void,
  get: () => T
): DrawingToolActions => ({
  // 描画ツールの有効/無効を切り替え
  toggleDrawingTool: (tool) => {
    const currentTools = [...get().activeDrawingTools];
    const toolIndex = currentTools.indexOf(tool);
    
    // 描画ツールは排他的に選択する（一度に1つのみアクティブ）
    if (toolIndex >= 0) {
      // ツールが既に選択されている場合は解除
      currentTools.splice(toolIndex, 1);
    } else {
      // 他のツールをクリアして新しいツールを選択
      currentTools.length = 0;
      currentTools.push(tool);
    }
    
    set({ activeDrawingTools: currentTools } as unknown as Partial<T>);
  },
  
  // 全ての描画ツールをクリア
  clearAllDrawingTools: () => {
    set({ activeDrawingTools: [] } as unknown as Partial<T>);
  }
}) 