// store/chart/indicator/types.ts
// 作成: 2025-10-06 - IndicatorSliceのState, Actions, Slice型を定義

import { type IndicatorType, type IndicatorConfig } from "@/types/store/chart";
import { type SliceCreator } from '@/types/store/core';

/**
 * インジケータースライスの状態型定義
 */
export interface IndicatorSliceState {
  indicators: IndicatorConfig[];
  activeIndicators: IndicatorType[];
}

/**
 * インジケータースライスのアクション型定義
 */
export interface IndicatorSliceActions {
  addIndicator: (indicator: IndicatorConfig) => void;
  removeIndicator: (id: string) => void;
  toggleIndicator: (type: IndicatorType) => void;
  updateIndicatorSettings: (id: string, settings: Partial<IndicatorConfig>) => void;
}

/**
 * インジケータースライスの完全な型定義（状態+アクション）
 */
export type IndicatorSlice = IndicatorSliceState & IndicatorSliceActions;

/**
 * スライスクリエーター型
 * Zustandのset, getを受け取り、IndicatorSliceを返す関数の型
 */
export type IndicatorSliceCreator = SliceCreator<IndicatorSlice, IndicatorSliceState>; 