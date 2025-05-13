// hooks/useRootChartStore.ts
// 初期実装: rootStoreのチャートスライスを使用するためのフック

import { useRootStore } from '@/store/rootStore'
import { 
  selectTimeframe, 
  selectChartType, 
  selectOHLCData, 
  selectCurrentPrice 
} from '@/store/chart/selectors'

/**
 * ルートストアからチャートスライスの状態とアクションを取得するフック
 * 既存の実装と互換性を保ちながら、リファクタリングされたストアを使用する
 */
export const useRootChartStore = () => {
  // セレクターを使用してステート取得
  const timeframe = useRootStore(selectTimeframe)
  const chartType = useRootStore(selectChartType)
  const ohlcData = useRootStore(selectOHLCData) 
  const currentPrice = useRootStore(selectCurrentPrice)
  
  // アクションを取得
  const setTimeframe = useRootStore(state => state.setTimeframe)
  const setChartType = useRootStore(state => state.setChartType)
  const refreshOhlcData = useRootStore(state => state.refreshOhlcData)
  
  return {
    // 状態
    timeframe,
    chartType,
    ohlcData,
    currentPrice,
    
    // ChartDataStoreのインターフェイスと互換性のある名前
    currentTimeFrame: timeframe,
    data: ohlcData,
    
    // アクション
    setTimeframe,
    refreshOhlcData,
    
    // ChartDataStoreのインターフェイスと互換性のある名前
    updateTimeFrame: setTimeframe,
    
    // ChartConfigStoreと互換性のある名前
    setChartType,
    
    // ローディング状態とエラーのプレースホルダー
    isLoading: false,
    error: null,
    fetchData: (symbol: string, timeframe: string) => {
      refreshOhlcData()
    }
  }
} 