// store/chart/useDrawingToolStore.ts
// 作成: 描画ツール関連の状態管理ストア
// 
// このストアはチャートの描画ツール（フィボナッチリトレースメント、長方形など）の状態を管理します。
/**
 * @deprecated rootStore の DrawingToolSlice へ移行済み。削除予定。
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { DrawingToolState, DrawingToolType } from "../../types/store";

// 描画ツールストアの作成
export const useDrawingToolStore = create<DrawingToolState>()(
  devtools(
    persist(
      (set, get) => ({
        // 状態
        activeDrawingTools: [],
        
        // アクション
        toggleDrawingTool: (tool: DrawingToolType) => {
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
          
          set({ activeDrawingTools: currentTools });
        },
        
        clearAllDrawingTools: () => {
          set({ activeDrawingTools: [] });
        }
      }),
      {
        name: "drawing-tool-storage",
        partialize: (state) => ({
          // 永続化する状態のみを選択
          activeDrawingTools: state.activeDrawingTools
        }),
      }
    ),
    { name: "drawing-tool-store" }
  )
);
