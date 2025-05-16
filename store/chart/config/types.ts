// store/chart/config/types.ts
// 作成: 2025-10-06 - ChartConfigSliceのState, Actions, Slice型を定義

import { ChartType } from "@/types/chart";
import { ExchangeType } from "@/types/network/api";
import { type SliceCreator } from '@/types/store/core';

/**
 * チャート設定スライスの状態型定義
 */
export interface ChartConfigSliceState {
  // チャートの種類（ローソク足、線グラフなど）
  chartType: ChartType;
  
  // 取引種別（現物、先物など）
  exchangeType: ExchangeType;
  
  // チャートの色設定
  colors: {
    upColor: string;
    downColor: string;
    borderUpColor: string;
    borderDownColor: string;
    wickUpColor: string;
    wickDownColor: string;
    backgroundColor: string;
    textColor: string;
    gridColor: string;
  };
  
  // グリッド表示設定
  grid: {
    horzLines: boolean;
    vertLines: boolean;
  };
}

/**
 * チャート設定スライスのアクション型定義
 */
export interface ChartConfigSliceActions {
  // チャートタイプを設定するアクション
  setChartType: (chartType: ChartType) => void;
  
  // 取引種別を設定するアクション
  setExchangeType: (exchangeType: ExchangeType) => void;
}

/**
 * チャート設定スライスの完全な型定義（状態+アクション）
 */
export type ChartConfigSlice = ChartConfigSliceState & ChartConfigSliceActions;

/**
 * スライスクリエーター型定義
 */
export type ChartConfigSliceCreator = SliceCreator<ChartConfigSlice, ChartConfigSliceState>; 