// types/chartModels.ts
// 作成: リファクタリングしたチャートコンポーネント用の型定義

import { Time, DeepPartial, ChartOptions as LightweightChartOptions } from 'lightweight-charts';
import { OHLCData, Timeframe } from './chart';

// ChartTimeframeの型定義（既存のTimeframe型と同等）
export type ChartTimeframe = Timeframe;

// チャートキャンドルの型定義
export interface ChartCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// チャート線データの型定義
export interface ChartLineData {
  time: number;
  value: number;
}

// チャートデータの型定義
export interface ChartData {
  candles: ChartCandle[];
  timestamp: number;
}

// チャートストアの状態定義
export interface ChartStoreState {
  // 状態
  currentTimeframe: ChartTimeframe;
  chartOptions: DeepPartial<LightweightChartOptions>;
  visibleIndicators: {
    ma7: boolean;
    ma25: boolean;
    ma99: boolean;
    bollinger: boolean;
    rsi: boolean;
    macd: boolean;
  };

  // アクション
  updateTimeframe: (timeframe: ChartTimeframe) => void;
  updateChartOptions: (options: DeepPartial<LightweightChartOptions>) => void;
  toggleIndicator: (indicator: keyof ChartStoreState['visibleIndicators']) => void;
}

// マーケットデータストアの状態定義
export interface MarketDataStoreState {
  // 状態
  marketData: ChartData | null;
  isLoading: boolean;
  error: Error | null;

  // アクション
  fetchMarketData: (timeframe: ChartTimeframe) => Promise<void>;
  resetMarketData: () => void;
} 