// types/store/chart.ts
// チャートストア関連の型定義
// 更新: 2025-10-06 - IndicatorConfig型を追加
// 更新: 2025-10-10 - DrawingTool型を追加

import { OHLCData } from '../chart';
import { Timeframe, ChartType, ExchangeType } from '../constants/enums';
import { BitgetApiClient } from '../../services/api/bitget/client.new';

/**
 * インジケーターの種類
 */
type IndicatorType = 'rsi' | 'macd' | 'ichimoku' | 'bollinger' | 'ema';

/**
 * インジケーターの設定
 */
interface IndicatorConfig {
  id: string;
  type: IndicatorType;
  params: Record<string, any>;
  isActive: boolean;
  name?: string;
}

/**
 * アクティブなインジケーターの設定
 */
interface ActiveIndicator {
  type: IndicatorType;
  params: Record<string, any>;
}

/**
 * 描画ツールの種類
 */
type DrawingToolType = 'fibonacci' | 'rectangle' | 'line' | 'arrow' | 'text';

/**
 * 描画ツール情報
 */
interface DrawingTool {
  id: string;
  type: DrawingToolType;
  points: Array<{ x: number; y: number }>;
  properties?: Record<string, any>;
}

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

export type { IndicatorType, ActiveIndicator, DrawingToolType, IndicatorConfig, DrawingTool }; 