// store/chart/indicator/state.ts
// 作成: IndicatorSliceの状態定義
// 更新: T-7.5フェーズ - 型インポートパスを修正
// 更新: 2025-10-06 - 型定義をtypes.tsに移動し、状態構造を更新

import { type IndicatorSliceState } from './types';
import { type IndicatorType } from "@/types/store/chart";

/**
 * インジケータースライスの初期状態
 */
export const initialIndicatorState: IndicatorSliceState = {
  // インジケーターの設定リスト
  indicators: [],
  
  // アクティブなインジケーターのタイプリスト
  activeIndicators: []
}; 