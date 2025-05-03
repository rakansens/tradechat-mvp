// store/chart/selectors.ts
// 更新: メモ化されたセレクター関数
// 
// このファイルはZustandストアのパフォーマンスを向上させるためのメモ化されたセレクター関数を提供します。

// reselectパッケージからcreateSelectorをインポート
import { createSelector } from 'reselect';

// チャートデータの型定義
import { OHLCData } from '@/types/chart';

// チャートユーティリティ関数をインポート
import * as chartUtils from '@/utils/chartUtils';

// チャートデータセレクター
export const selectChartData = (state: { data: OHLCData[] }) => state.data;

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

// SMAセレクター
export const selectSMA = (period: number) => 
  createSelector(
    [selectChartData],
    (data: OHLCData[]): number[] => {
      if (!data || data.length === 0) return [];
      return chartUtils.calculateSMA(data.map(d => d.close), period);
    }
  );

// RSIセレクター
export const selectRSI = (period: number = 14) => 
  createSelector(
    [selectChartData],
    (data: OHLCData[]): number[] => {
      if (!data || data.length < period + 1) return [];
      return chartUtils.calculateRSI(data.map(d => d.close), period);
    }
  );

// MACDセレクター
export const selectMACD = (fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9) => 
  createSelector(
    [selectChartData],
    (data: OHLCData[]) => {
      if (!data || data.length < slowPeriod + signalPeriod) return { macd: [], signal: [], histogram: [] };
      return chartUtils.calculateMACD(data.map(d => d.close), fastPeriod, slowPeriod, signalPeriod);
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
