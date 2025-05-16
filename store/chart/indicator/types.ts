// store/chart/indicator/types.ts
// 作成: 2025-10-05 - IndicatorSliceのState, Actions, Slice型を定義

import type { IndicatorType, ActiveIndicator } from "@/types/store/chart";
import { type SliceCreator } from '@/types/store/core';

/**
 * インジケータースライスの状態型定義
 */
export interface IndicatorSliceState {
  activeIndicators: ActiveIndicator[];
}

/**
 * インジケータースライスのアクション型定義
 */
export interface IndicatorSliceActions {
  // インジケーターの有効/無効を切り替えるアクション
  toggleIndicator: (indicator: IndicatorType, params?: Record<string, any>) => void;
  
  // インジケーターのパラメーターを更新するアクション
  updateIndicatorParams: (indicator: IndicatorType, params: Record<string, any>) => void;
  
  // 全てのインジケーターをクリアするアクション
  clearAllIndicators: () => void;
}

/**
 * インジケータースライスの型定義（状態+アクション）
 */
export type IndicatorSlice = IndicatorSliceState & IndicatorSliceActions;

/**
 * スライスクリエーター型定義
 */
export type IndicatorSliceCreator = SliceCreator<IndicatorSlice, IndicatorSliceState>; 