// store/chart/selectors.ts
// 更新: 基本セレクターとメモ化されたセレクターの明確な分離
// 更新: 型安全性の向上のため、部分的な型定義を完全な型定義に置き換え
//
// このファイルはZustandストアのパフォーマンスを向上させるためのセレクター関数を提供します。
// 基本セレクターは単純なステート取得のみを行い、計算が必要なセレクターはメモ化されています。

// reselectパッケージからcreateSelectorをインポート
import { createSelector } from 'reselect';

// チャートデータの型定義
import { OHLCData, Timeframe, ChartType } from '@/types/chart';
import { ChartDataState } from '@/types/store';

// チャートユーティリティ関数をインポート
import * as chartUtils from '@/utils/chartUtils';

// ==========================================
// 基本セレクター
// ==========================================
// 単純なステート取得のみを行う関数

// チャートデータセレクター
export const selectChartData = (state: ChartDataState) => state.data;

// 現在のシンボルセレクター
export const selectChartCurrentSymbol = (state: ChartDataState) => state.currentSymbol;

// 現在のタイムフレームセレクター
export const selectCurrentTimeFrame = (state: ChartDataState) => state.currentTimeFrame;

// ローディング状態セレクター
export const selectIsLoading = (state: ChartDataState) => state.isLoading;

// エラー状態セレクター
export const selectError = (state: ChartDataState) => state.error;

// チャートタイプセレクター
export const selectChartType = (state: { chartType: ChartType }) => state.chartType;

// アクションセレクター
export const selectUpdateTimeFrame = (state: ChartDataState) =>
  state.updateTimeFrame;

export const selectUpdateSymbol = (state: ChartDataState) =>
  state.updateSymbol;

export const selectFetchData = (state: ChartDataState) =>
  state.fetchData;

export const selectSetChartType = (state: { setChartType: (type: ChartType) => void }) =>
  state.setChartType;

export const selectStopRealTimeUpdates = (state: { stopRealTimeUpdates: () => void }) =>
  state.stopRealTimeUpdates;

// ==========================================
// メモ化されたセレクター
// ==========================================
// 計算処理を含み、結果をメモ化する関数

// 現在の価格セレクター
export const selectCurrentPrice = createSelector(
  [selectChartData],
  (data: OHLCData[]): number => {
    if (!data || data.length === 0) return 0;
    return data[data.length - 1].close;
  }
);

// 価格変化率セレクター（24時間）
export const selectPriceChangePercent = createSelector(
  [selectChartData],
  (data: OHLCData[]): number => {
    if (!data || data.length < 2) return 0;
    
    const currentPrice = data[data.length - 1].close;
    // 24時間前のデータを探す（タイムフレームによって異なる）
    // 簡易的な実装として、24ポイント前のデータを使用
    const prevIndex = Math.max(0, data.length - 25);
    const prevPrice = data[prevIndex].close;
    
    return ((currentPrice - prevPrice) / prevPrice) * 100;
  }
);

// 出来高セレクター
export const selectVolume = createSelector(
  [selectChartData],
  (data: OHLCData[]): number[] => {
    if (!data || data.length === 0) return [];
    return data.map(d => d.volume || 0);
  }
);

// 高値セレクター
export const selectHighPrice = createSelector(
  [selectChartData],
  (data: OHLCData[]): number => {
    if (!data || data.length === 0) return 0;
    return Math.max(...data.map(d => d.high));
  }
);

// 安値セレクター
export const selectLowPrice = createSelector(
  [selectChartData],
  (data: OHLCData[]): number => {
    if (!data || data.length === 0) return 0;
    return Math.min(...data.map(d => d.low));
  }
);

// 日付範囲セレクター
export const selectDateRange = createSelector(
  [selectChartData],
  (data: OHLCData[]): [Date, Date] | null => {
    if (!data || data.length === 0) return null;
    const startDate = new Date(data[0].time * 1000);
    const endDate = new Date(data[data.length - 1].time * 1000);
    return [startDate, endDate];
  }
);

// ==========================================
// パラメータ化されたメモ化セレクター
// ==========================================
// パラメータを受け取り、メモ化された結果を返す関数

// SMAセレクター
// 部分的な型定義を許容するためのヘルパー型
type ChartDataInput = { data: OHLCData[] } | ChartDataState;

// データアクセス用のヘルパー関数
const getData = (state: ChartDataInput): OHLCData[] => {
  return 'data' in state ? state.data : [];
};

export const selectSMA = (period: number) =>
  createSelector(
    [(state: ChartDataInput) => getData(state)],
    (data: OHLCData[]): number[] => {
      if (!data || data.length === 0) return [];
      return chartUtils.calculateSMA(data.map(d => d.close), period);
    }
  );

// RSIセレクター
export const selectRSI = (period: number = 14) =>
  createSelector(
    [(state: ChartDataInput) => getData(state)],
    (data: OHLCData[]): number[] => {
      if (!data || data.length < period + 1) return [];
      return chartUtils.calculateRSI(data.map(d => d.close), period);
    }
  );

// MACDセレクター
export const selectMACD = (fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) =>
  createSelector(
    [(state: ChartDataInput) => getData(state)],
    (data: OHLCData[]) => {
      if (!data || data.length < slowPeriod + signalPeriod) return { macd: [], signal: [], histogram: [] };
      return chartUtils.calculateMACD(data.map(d => d.close), fastPeriod, slowPeriod, signalPeriod);
    }
  );
