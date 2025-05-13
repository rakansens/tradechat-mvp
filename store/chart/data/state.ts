// store/chart/data/state.ts
// 作成: ChartDataSliceの状態定義

import { OHLCData, Timeframe } from "@/types/chart"
import { generateOHLCData } from "@/utils/ohlcDummyData"

// ローカルストレージから初期設定を取得するヘルパー関数
const getInitialTimeframe = (): Timeframe => {
  if (typeof window === 'undefined') return "1d"
  
  // 両方のキーを個別に取得して、どちらが最新かを確認
  const lastUsedTimeframeValue = localStorage.getItem('lastUsedTimeframe')
  const selectedTimeframeValue = localStorage.getItem('selectedTimeframe')
  
  // selectedTimeframeを優先する（これが最新の値）
  const storedTimeframe = selectedTimeframeValue || lastUsedTimeframeValue
  
  if (storedTimeframe && ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'].includes(storedTimeframe)) {
    return storedTimeframe as Timeframe
  }
  
  return "1d"
}

// ローカルストレージからシンボルを取得する関数
const getInitialSymbol = (): string => {
  if (typeof window === 'undefined') return 'BTCUSDT'
  return localStorage.getItem('lastUsedSymbol') || 'BTCUSDT'
}

// 初期タイムフレームの取得
export const initialTimeframe = getInitialTimeframe()

// 初期チャートデータの生成
export const initialOhlcData: OHLCData[] = generateOHLCData(
  100,
  initialTimeframe
)

/**
 * チャートデータスライスの状態型定義
 */
export interface ChartDataSliceState {
  // ローソク足データ
  data: OHLCData[]
  
  // データ読み込み状態
  isLoading: boolean
  
  // エラー情報
  error: string | null
  
  // 現在選択されているシンボル
  currentSymbol: string
  
  // 現在選択されているタイムフレーム
  currentTimeFrame: Timeframe
  
  // リクエストキャンセル用
  _abortController: AbortController | null
}

/**
 * チャートデータスライスの初期状態
 */
export const initialChartDataState: ChartDataSliceState = {
  data: initialOhlcData,
  isLoading: false,
  error: null,
  currentSymbol: getInitialSymbol(),
  currentTimeFrame: initialTimeframe,
  _abortController: null
} 