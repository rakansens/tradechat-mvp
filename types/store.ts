// types/store.ts
// 作成: ストア関連の型定義
// 
// このファイルはZustandストアの型定義を集約しています。
// 各ストアの状態とアクションの型を定義し、型安全性を確保します。

import { OHLCData, Timeframe, ChartType } from './chart';
import { ExchangeType } from './api';
import { BitgetApiClient } from '../services/bitgetApi';

/**
 * インジケーターの種類
 */
export type IndicatorType = 'rsi' | 'macd' | 'ichimoku' | 'bollinger' | 'ema';

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
  
  // アクション
  fetchData: (symbol: string, timeFrame: Timeframe) => Promise<void>;
  updateData: (data: OHLCData) => void;
  updateTimeFrame: (timeFrame: Timeframe) => Promise<void>;
  updateSymbol: (symbol: string) => Promise<void>;
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
  activeIndicators: IndicatorType[];
  
  // アクション
  toggleIndicator: (indicator: IndicatorType) => void;
  clearAllIndicators: () => void;
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
  
  // アクション
  startRealTimeUpdates: () => void;
  stopRealTimeUpdates: () => void;
  toggleRealTimeData: () => void;
  initializeApi: (exchangeType: ExchangeType) => void;
}

/**
 * UIストアの状態
 */
export interface UIState {
  // 状態
  activeTab: TabType;
  isDarkMode: boolean;
  isSidebarOpen: boolean;
  
  // アクション
  setActiveTab: (tab: TabType) => void;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
}

/**
 * タブの種類
 */
export type TabType = 'chart' | 'orderbook' | 'trades' | 'positions' | 'settings';
