// store/chart/data/selectors.ts
// 作成: ChartDataSliceのセレクター

import { createSelector } from 'reselect'
import type { OHLCData } from '@/types/chart'
import type { RootStore } from '@/store/rootStore'
import type { ChartDataSliceState } from './state'

/**
 * チャートデータを選択するセレクター
 */
export const selectChartData = (state: RootStore) => state.data

/**
 * チャートデータの読み込み状態を選択するセレクター
 */
export const selectIsLoading = (state: RootStore) => state.isLoading

/**
 * チャートデータのエラー状態を選択するセレクター
 */
export const selectError = (state: RootStore) => state.error

/**
 * 現在選択されているシンボルを選択するセレクター
 */
export const selectCurrentSymbol = (state: RootStore) => state.currentSymbol

/**
 * 現在選択されているタイムフレームを選択するセレクター
 */
export const selectCurrentTimeFrame = (state: RootStore) => state.currentTimeFrame

/**
 * 最新の価格を選択するメモ化されたセレクター
 */
export const selectCurrentPrice = createSelector(
  [selectChartData],
  (data: OHLCData[]): number => {
    if (!data || data.length === 0) return 0
    const lastCandle = data[data.length - 1]
    return lastCandle.close
  }
)

/**
 * 最新のOHLCデータを選択するメモ化されたセレクター
 */
export const selectLatestCandle = createSelector(
  [selectChartData],
  (data: OHLCData[]): OHLCData | null => {
    if (!data || data.length === 0) return null
    return data[data.length - 1]
  }
)

/**
 * チャートデータの最高値と最安値を選択するメモ化されたセレクター
 * チャート描画の際のスケーリングに役立ちます
 */
export const selectPriceRange = createSelector(
  [selectChartData],
  (data: OHLCData[]): { min: number; max: number } => {
    if (!data || data.length === 0) return { min: 0, max: 0 }
    
    let min = Infinity
    let max = -Infinity
    
    // 最新の100件のみを対象にして計算を最適化
    const startIndex = Math.max(0, data.length - 100)
    
    for (let i = startIndex; i < data.length; i++) {
      const candle = data[i]
      min = Math.min(min, candle.low)
      max = Math.max(max, candle.high)
    }
    
    return { min, max }
  }
)

/**
 * 指定した期間のOHLCデータを選択するメモ化されたセレクター
 */
export const makeSelectDataForRange = () => 
  createSelector(
    [selectChartData, (_: RootStore, range: number) => range],
    (data: OHLCData[], range: number): OHLCData[] => {
      if (!data || data.length === 0) return []
      
      // 最新のN件を返す
      return data.slice(Math.max(0, data.length - range))
    }
  ) 