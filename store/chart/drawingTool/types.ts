// store/chart/drawingTool/types.ts
// 作成: 2025-10-06 - DrawingToolSliceのState, Actions, Slice型を定義

import { type DrawingToolType } from "@/types/store/chart";
import { type SliceCreator } from '@/types/store/core';

/**
 * 描画ツールスライスの状態型定義
 */
export interface DrawingToolSliceState {
  // 現在選択されている描画ツール
  activeDrawingTool: DrawingToolType | null;
  
  // 描画ツールが有効かどうか
  isDrawingActive: boolean;
  
  // 描画データ (各ツール用のデータを保存)
  drawingData: Record<string, any> | null;
}

/**
 * 描画ツールスライスのアクション型定義
 */
export interface DrawingToolSliceActions {
  // 描画ツールを切り替えるアクション
  toggleDrawingTool: (toolType: DrawingToolType) => void;
  
  // すべての描画ツールをクリアするアクション
  clearAllDrawingTools: () => void;
}

/**
 * 描画ツールスライスの完全な型定義（状態+アクション）
 */
export type DrawingToolSlice = DrawingToolSliceState & DrawingToolSliceActions;

/**
 * スライスクリエーター型定義
 */
export type DrawingToolSliceCreator = SliceCreator<DrawingToolSlice, DrawingToolSliceState>; 