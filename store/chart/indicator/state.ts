// store/chart/indicator/state.ts
// 作成: IndicatorSliceの状態定義
// 更新: T-7.5フェーズ - 型インポートパスを修正

import type { ActiveIndicator } from "@/types/store/chart";

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