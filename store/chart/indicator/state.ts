// store/chart/indicator/state.ts
// 作成: IndicatorSliceの状態定義

import type { ActiveIndicator } from "@/types/store";

/**
 * インジケータースライスの状態型定義
 */
export interface IndicatorSliceState {
  activeIndicators: ActiveIndicator[];
}

/**
 * インジケータースライスの初期状態
 */
export const initialIndicatorState: IndicatorSliceState = {
  activeIndicators: []
}; 