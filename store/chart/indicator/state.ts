// store/chart/indicator/state.ts
// 作成: IndicatorSliceの状態定義
// 更新: 2025-10-06 - 型定義をtypes.tsに移動し、状態構造を更新
// 更新: 2025-10-10 - 状態型を再エクスポートして型参照問題を解消

import { type IndicatorSliceState } from './types';
import { type IndicatorConfig } from '@/types/store/chart';

/**
 * インジケータースライスの初期状態
 */
export const initialIndicatorState: IndicatorSliceState = {
  // インジケーター設定のリスト
  indicators: [
    {
      id: 'rsi-default',
      type: 'rsi',
      params: { period: 14, overbought: 70, oversold: 30 },
      isActive: false,
      name: 'RSI (14)'
    },
    {
      id: 'macd-default',
      type: 'macd',
      params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
      isActive: false,
      name: 'MACD (12,26,9)'
    },
    {
      id: 'bollinger-default',
      type: 'bollinger',
      params: { period: 20, stdDev: 2 },
      isActive: false,
      name: 'Bollinger Bands (20,2)'
    }
  ],
  
  // アクティブなインジケーターのタイプリスト
  activeIndicators: []
};

// インジケータースライスの状態型を再エクスポート（型参照問題解消のため）
export type { IndicatorSliceState }; 