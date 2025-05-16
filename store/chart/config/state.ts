// store/chart/config/state.ts
// 作成: ChartConfigSliceの状態定義
// 更新: 2025-10-06 - 型定義をtypes.tsに移動し、状態構造を更新

import { type ChartConfigSliceState } from './types';

/**
 * チャート設定スライスの初期状態
 */
export const initialChartConfigState: ChartConfigSliceState = {
  chartType: "candles", // デフォルトはローソク足チャート
  exchangeType: "spot",  // デフォルトは現物取引
  
  // チャートの色設定
  colors: {
    upColor: '#26a69a',       // 上昇時の色
    downColor: '#ef5350',     // 下落時の色
    borderUpColor: '#26a69a', // 上昇時の境界線色
    borderDownColor: '#ef5350', // 下落時の境界線色
    wickUpColor: '#26a69a',   // 上昇時のヒゲ色
    wickDownColor: '#ef5350', // 下落時のヒゲ色
    backgroundColor: 'transparent', // 背景色
    textColor: '#d1d4dc',     // テキスト色
    gridColor: 'rgba(42, 46, 57, 0.2)', // グリッド線の色
  },
  
  // グリッド表示設定
  grid: {
    horzLines: true,  // 水平線表示
    vertLines: true   // 垂直線表示
  }
}; 