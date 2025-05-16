// store/chart/data/types.ts
// 作成: ChartDataスライスの型定義
// 役割: State, Actions, Sliceの3つのインターフェースを定義
// 更新: 2025-10-09 - S-11.2フェーズ: SliceCreator型への移行

import { OHLCData, Timeframe } from "@/types/chart"
import { type SliceCreator } from "@/types/store/core"

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
 * チャートデータスライスのアクション型定義
 */
export interface ChartDataSliceActions {
  // チャートデータを取得するアクション
  fetchData: (symbol: string, timeFrame: Timeframe, signal?: AbortSignal, useCache?: boolean) => Promise<OHLCData[] | undefined>
  
  // データを更新するアクション
  updateData: (data: OHLCData) => void
  
  // タイムフレームを更新するアクション
  updateTimeFrame: (timeFrame: Timeframe) => Promise<void>
  
  // シンボルを更新するアクション
  updateSymbol: (symbol: string) => Promise<void>
  
  // 最後のローソク足を更新するアクション（リアルタイム更新用）
  updateLastCandle: (newCandle: OHLCData) => void
}

/**
 * チャートデータスライスの完全な型定義（状態+アクション）
 */
export type ChartDataSlice = ChartDataSliceState & ChartDataSliceActions

/**
 * スライスクリエーター型定義
 */
export type ChartDataSliceCreator = SliceCreator<ChartDataSlice, ChartDataSliceState> 