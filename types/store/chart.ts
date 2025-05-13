// types/store/chart.ts
// チャートストア関連の型定義

import { OHLCData, Timeframe, ChartType } from '../chart';
import { ExchangeType } from '../api';
import { BitgetApiClient } from '../../services/api/bitget/client';

/**
 * インジケーターの種類
 */
export type IndicatorType = 'rsi' | 'macd' | 'ichimoku' | 'bollinger' | 'ema';

/**
 * アクティブなインジケーターの設定
 */
export interface ActiveIndicator {
  type: IndicatorType;
  params: Record<string, any>;
}

/**
 * 描画ツールの種類
 */
export type DrawingToolType = 'fibonacci' | 'rectangle' | 'line' | 'arrow' | 'text';

/**
 * チャートデータストアの状態
 */
export interface ChartDataState {
  // 状態
  data: OHLCData[];
  isLoading: boolean;
  error: string | null;
  currentSymbol: string;
  currentTimeFrame: Timeframe;
  _abortController: AbortController | null; // リクエストキャンセル用
  
  // アクション
  fetchData: (symbol: string, timeFrame: Timeframe, signal?: AbortSignal, useCache?: boolean) => Promise<OHLCData[]>;
  updateData: (data: OHLCData) => void;
  updateTimeFrame: (timeFrame: Timeframe) => Promise<void>;
  updateSymbol: (symbol: string) => Promise<void>;
  
  // リアルタイム更新用のアクション
  updateLastCandle: (newCandle: OHLCData) => void;
}

/**
 * チャート設定ストアの状態
 */
export interface ChartConfigState {
  // 状態
  chartType: ChartType;
  exchangeType: ExchangeType;
  
  // アクション
  setChartType: (chartType: ChartType) => void;
  setExchangeType: (type: ExchangeType) => void;
}

/**
 * インジケーターストアの状態
 */
export interface IndicatorState {
  // 状態
  activeIndicators: ActiveIndicator[];
  
  // アクション
  toggleIndicator: (indicator: IndicatorType, params?: Record<string, any>) => void;
  updateIndicatorParams: (indicator: IndicatorType, params: Record<string, any>) => void;
  clearAllIndicators: () => void;
  getIndicatorParams: (indicator: IndicatorType) => Record<string, any> | undefined;
  isIndicatorActive: (indicator: IndicatorType) => boolean;
}

/**
 * 描画ツールストアの状態
 */
export interface DrawingToolState {
  // 状態
  activeDrawingTools: DrawingToolType[];
  
  // アクション
  toggleDrawingTool: (tool: DrawingToolType) => void;
  clearAllDrawingTools: () => void;
}

/**
 * リアルタイム更新ストアの状態
 */
export interface RealTimeState {
  // 状態
  useRealTimeData: boolean;
  bitgetApi: BitgetApiClient | null;
  lastSubscriptionKey: string; // 最後に購読したキー
  
  // 公開アクション
  startRealTimeUpdates: () => void;
  stopRealTimeUpdates: () => void;
  toggleRealTimeData: () => void;
  initializeApi: (exchangeType: ExchangeType) => void;
  
  // 内部アクション
  _debouncedStartRealTimeUpdates: () => void;
  _startRealTimeUpdatesImpl: () => void;
} 