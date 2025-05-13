// store/chart/data/actions.ts
// 作成: ChartDataSliceのアクション定義

import type { StateCreator } from "zustand"
import { OHLCData, Timeframe } from "@/types/chart"
import { ExchangeType } from "@/types/api"
import { ChartDataSliceState, initialTimeframe } from "./state"
import { chartDataService } from "@/services/data"
import { cacheService } from "@/services/cache"
import { logger } from '@/utils/common'
import { generateOHLCData } from "@/utils/ohlcDummyData"
// 直接ExchangeTypeを取得するように修正
import { useRootStore } from "@/store/rootStore"
import {
  validateOHLCData,
  validateTimeframe,
  validateChartDataState
} from "@/lib/validations/chart"

// ローカルストレージから取引種別を取得する関数
const getExchangeTypeFromLocalStorage = (): ExchangeType => {
  if (typeof window === 'undefined') return 'spot'
  
  const storedExchangeType =
    localStorage.getItem('lastUsedExchangeType') ||
    localStorage.getItem('selectedInstrumentType')
    
  if (storedExchangeType && (storedExchangeType === 'spot' || storedExchangeType === 'futures')) {
    return storedExchangeType as ExchangeType
  }
  
  return 'spot'
}

export interface ChartDataActions {
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

export type ChartDataSlice = ChartDataSliceState & ChartDataActions

/**
 * チャートデータスライスのアクションを作成する関数
 */
export const createChartDataActions = <T extends ChartDataSlice>(
  set: (state: Partial<T>) => void,
  get: () => T
): ChartDataActions => ({
  fetchData: async (symbol: string, timeFrame: Timeframe, signal?: AbortSignal, useCache: boolean = false) => {
    // 開発環境でのバリデーション
    if (process.env.NODE_ENV !== 'production') {
      const timeframeResult = validateTimeframe(timeFrame)
      if (!timeframeResult.success) {
        logger.warn(`Invalid timeframe: ${timeFrame}`, {
          component: 'ChartDataSlice',
          action: 'fetchData',
          error: timeframeResult.error
        })
      }
    }
    
    set({ isLoading: true, error: null } as Partial<T>)
    
    // 最新の状態を取得（リフレッシュボタンが押された場合など、状態が変わっている可能性がある）
    const currentState = get()
    const latestTimeFrame = currentState.currentTimeFrame
    const latestSymbol = currentState.currentSymbol
    
    // 明示的に渡されたシンボルとタイムフレームを使用するか、最新の状態を使用する
    const finalSymbol = symbol || latestSymbol
    const finalTimeFrame = timeFrame || latestTimeFrame
    
    try {
      // 取引種別をローカルストレージから取得
      const exchangeType = getExchangeTypeFromLocalStorage()
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('[fetchData] exchangeType:', exchangeType, 'symbol:', finalSymbol, 'timeframe:', finalTimeFrame)
        console.log('[fetchData] original symbol:', symbol, 'latest symbol:', latestSymbol)
      }
      
      // データ取得前のデータ内容を記録
      logger.debug(`データ取得前のデータ内容:`, {
        component: 'ChartDataSlice',
        action: 'fetchData',
        symbol: finalSymbol,
        timeFrame: finalTimeFrame,
        dataCount: get().data.length,
        dataSample: get().data.slice(-3) // 最後の3件のデータをサンプルとして記録
      })
      
      // 共通サービスを使用してチャートデータを取得（キャッシュを使用）
      const data = await chartDataService.fetchChartData(
        finalSymbol,
        finalTimeFrame,
        exchangeType,
        signal,
        useCache // キャッシュを使用するかどうか
      )
      
      // 取得したデータの内容を記録
      logger.debug(`取得したデータの内容:`, {
        component: 'ChartDataSlice',
        action: 'fetchData',
        symbol: finalSymbol,
        timeFrame: finalTimeFrame,
        dataCount: data.length,
        dataSample: data.slice(-3) // 最後の3件のデータをサンプルとして記録
      })
      
      // 重要: 現在のシンボルとリクエストされたシンボルが一致するか確認
      // これにより古いリクエストの結果が新しいシンボルを上書きするのを防止
      const latestState = get()
      if (latestState.currentSymbol !== finalSymbol) {
        logger.info(`シンボルが変更されています。古いリクエスト結果を破棄: ${finalSymbol} != ${latestState.currentSymbol}`, {
          component: 'ChartDataSlice',
          action: 'fetchData'
        })
        return data // データは返すが状態は更新しない
      }
      
      // 状態を更新
      set({
        data,
        isLoading: false,
        currentSymbol: finalSymbol,
        currentTimeFrame: finalTimeFrame
      } as Partial<T>)
      
      // 状態更新後のデータ内容を記録
      logger.debug(`状態更新後のデータ内容:`, {
        component: 'ChartDataSlice',
        action: 'fetchData',
        symbol: finalSymbol,
        timeFrame: finalTimeFrame,
        dataCount: get().data.length,
        dataSample: get().data.slice(-3) // 最後の3件のデータをサンプルとして記録
      })
      
      return data
    } catch (error: any) {
      // エラーハンドリング
      let errorMessage = 'チャートデータの取得に失敗しました'
      
      if (error.name === 'AbortError') {
        // AbortControllerによるキャンセルの場合は静かに失敗
        logger.info(`チャートデータ取得がキャンセルされました: ${symbol}`, {
          component: 'ChartDataSlice',
          action: 'fetchData'
        })
        return
      }
      
      if (error.response) {
        errorMessage = `API エラー: ${error.response.status} ${error.response.statusText}`
      } else if (error.request) {
        errorMessage = 'サーバーからの応答がありません'
      } else {
        errorMessage = `エラー: ${error.message}`
      }
      
      // 先物取引でサポートされていない銘柄のエラーの場合は、よりユーザーフレンドリーなメッセージに変換
      // rootStoreから取引種別を取得
      const exchangeType = getExchangeTypeFromLocalStorage();
      if (
        errorMessage.includes('先物取引でサポートされていません') ||
        (
          exchangeType === 'futures' &&
          (errorMessage.includes('status code 400') || errorMessage.includes('Bad Request'))
        )
      ) {
        errorMessage = `この銘柄は先物取引で利用できません。現物取引をお試しください。`
      }
      
      logger.error(errorMessage, {
        component: 'ChartDataSlice',
        action: 'fetchData',
        error
      })
      
      // APIが失敗した場合はダミーデータを使用
      const dummyData = generateOHLCData(100, timeFrame)
      set({
        data: dummyData,
        isLoading: false,
        error: errorMessage,
        currentSymbol: finalSymbol,         // エラー時でも現在のシンボルを保持
        currentTimeFrame: finalTimeFrame    // エラー時でも現在のタイムフレームを保持
      } as Partial<T>)
      
      return dummyData
    }
  },
  
  // データを更新
  updateData: (data: OHLCData) => {
    // 開発環境でのバリデーション
    if (process.env.NODE_ENV !== 'production') {
      const dataResult = validateOHLCData(data)
      if (!dataResult.success) {
        logger.warn('Invalid OHLC data', {
          component: 'ChartDataSlice',
          action: 'updateData',
          error: dataResult.error
        })
      }
    }
    set((state: ChartDataSliceState) => ({
      data: [...state.data, data]
    }) as Partial<T>)
  },
  
  // タイムフレームを更新
  updateTimeFrame: async (timeFrame: Timeframe) => {
    // 開発環境でのバリデーション
    if (process.env.NODE_ENV !== 'production') {
      const timeframeResult = validateTimeframe(timeFrame)
      if (!timeframeResult.success) {
        logger.warn(`Invalid timeframe: ${timeFrame}`, {
          component: 'ChartDataSlice',
          action: 'updateTimeFrame',
          error: timeframeResult.error
        })
      }
    }
    
    // 現在のタイムフレームと同じ場合は何もしない
    const currentTimeFrame = get().currentTimeFrame
    if (timeFrame === currentTimeFrame) {
      logger.info(`Timeframe already set to ${timeFrame}, skipping update`, {
        component: 'ChartDataSlice',
        action: 'updateTimeFrame'
      })
      return
    }
    
    // ログ出力
    logger.info(`Changing timeframe from ${currentTimeFrame} to ${timeFrame}`, {
      component: 'ChartDataSlice',
      action: 'updateTimeFrame'
    })
    
    // ローカルストレージに保存
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('lastUsedTimeframe', timeFrame)
        localStorage.setItem('selectedTimeframe', timeFrame) // 互換性のため
        logger.info(`Directly saved timeframe to localStorage: ${timeFrame}`, {
          component: 'ChartDataSlice',
          action: 'updateTimeFrame'
        })
      }
    } catch (e) {
      logger.warn('Failed to save timeframe to localStorage', {
        component: 'ChartDataSlice',
        action: 'updateTimeFrame',
        error: e
      })
    }
    
    // 重要: データフェッチサービスのキャッシュをクリア
    // これにより時間足変更時に古いキャッシュが使われないようにする
    try {
      const { currentSymbol } = get()
      const exchangeType = getExchangeTypeFromLocalStorage()
      
      logger.info(`タイムフレーム変更前のキャッシュクリア準備`, {
        component: 'ChartDataSlice',
        action: 'updateTimeFrame',
        currentSymbol,
        timeFrame,
        exchangeType,
        localStorage_lastUsedTimeframe: typeof window !== 'undefined' ? localStorage.getItem('lastUsedTimeframe') : null,
        localStorage_selectedTimeframe: typeof window !== 'undefined' ? localStorage.getItem('selectedTimeframe') : null
      })
      
      // キャッシュをクリア
      chartDataService.clearCacheOnSymbolChange(currentSymbol)
      logger.info(`Cleared chart cache for timeframe change to ${timeFrame}`, {
        component: 'ChartDataSlice',
        action: 'updateTimeFrame',
        symbol: currentSymbol,
        exchangeType
      })
    } catch (e) {
      logger.warn('Failed to clear cache for timeframe change', {
        component: 'ChartDataSlice',
        action: 'updateTimeFrame',
        error: e
      })
    }
    
    // 先にタイムフレームを更新してUIに即反映
    set({ 
      currentTimeFrame: timeFrame,
      isLoading: true,
      error: null
    } as Partial<T>)
    
    // 少し遅延させてから新しいデータを取得
    // これにより、UIの更新が先に行われる
    setTimeout(async () => {
      try {
        // 最新のシンボルとタイムフレームを取得（非同期処理中に変更された可能性がある）
        const { currentSymbol, currentTimeFrame } = get()
        
        // データ取得前のデータ内容を記録
        logger.debug(`タイムフレーム変更前のデータ内容:`, {
          component: 'ChartDataSlice',
          action: 'updateTimeFrame',
          currentTimeFrame,
          newTimeFrame: timeFrame,
          dataCount: get().data.length,
          dataSample: get().data.slice(-5) // 最後の5件のデータをサンプルとして記録
        })
        
        // タイムフレームが変更されていないことを確認
        if (timeFrame === currentTimeFrame) {
          // 最初にキャッシュをしっかりクリアする
          logger.info(`タイムフレーム変更に伴いキャッシュをクリアします: ${currentSymbol} ${timeFrame}`, {
            component: 'ChartDataSlice',
            action: 'updateTimeFrame'
          })
          
          // 全てのキャッシュをクリア
          cacheService.clear()
          
          // 特定のキャッシュをクリア
          chartDataService.clearCacheOnSymbolChange(currentSymbol)
          
          // キャッシュを使用せずに新しいデータを取得
          logger.info(`新しい時間足データを取得します: ${currentSymbol} ${timeFrame}`, {
            component: 'ChartDataSlice',
            action: 'updateTimeFrame'
          })
          
          // 強制的にキャッシュを使わずに新しいデータを取得
          await get().fetchData(currentSymbol, timeFrame, undefined, false)
          
          // データ取得後のデータ内容を記録
          logger.debug(`タイムフレーム変更後のデータ内容:`, {
            component: 'ChartDataSlice',
            action: 'updateTimeFrame',
            currentTimeFrame: get().currentTimeFrame,
            dataCount: get().data.length,
            dataSample: get().data.slice(-5) // 最後の5件のデータをサンプルとして記録
          })
          
          // リアルタイム更新を再開
          try {
            const rootStore = useRootStore.getState()
            if (rootStore.useRealTimeData) {
              rootStore.startRealTimeUpdates()
            }
          } catch (e) {
            logger.warn('Failed to update real-time updates', {
              component: 'ChartDataSlice',
              action: 'updateTimeFrame',
              error: e
            })
          }
        } else {
          logger.info(`Timeframe changed during async operation from ${timeFrame} to ${currentTimeFrame}, skipping fetch`, {
            component: 'ChartDataSlice',
            action: 'updateTimeFrame'
          })
        }
      } catch (e) {
        logger.error('Failed to fetch data after timeframe update', {
          component: 'ChartDataSlice',
          action: 'updateTimeFrame',
          error: e
        })
      }
    }, 50) // 状態更新後に実行するために少し遅延させる
  },
  
  // シンボルを更新
  updateSymbol: async (symbol: string) => {
    // 開発環境でのバリデーション
    if (process.env.NODE_ENV !== 'production' && (!symbol || typeof symbol !== 'string')) {
      logger.warn(`Invalid symbol: ${symbol}`, {
        component: 'ChartDataSlice',
        action: 'updateSymbol'
      })
    }
    
    // リクエストキャンセル用のAbortControllerを作成
    const abortController = new AbortController()
    
    // 自身のストア状態も更新（UIの即時反映のため）
    set({
      currentSymbol: symbol,
      isLoading: true,
      error: null,
      _abortController: abortController
    } as Partial<T>)
    
    // データ取得
    try {
      // 最新のタイムフレームを取得
      const { currentTimeFrame } = get()
      
      // 新しいデータを取得（AbortControllerのsignalを渡す）
      await get().fetchData(symbol, currentTimeFrame, abortController.signal, true)
      
      // リアルタイム更新を再開
      try {
        const rootStore = useRootStore.getState()
        if (rootStore.useRealTimeData) {
          rootStore.startRealTimeUpdates()
        }
      } catch (e) {
        logger.warn('Failed to start real-time updates', {
          component: 'ChartDataSlice',
          action: 'updateSymbol',
          error: e
        })
      }
    } catch (e: any) {
      // AbortErrorは通常のエラーとして扱わない
      if (e.name !== 'AbortError') {
        logger.error('Failed to fetch data after symbol update', {
          component: 'ChartDataSlice',
          action: 'updateSymbol',
          error: e
        })
      } else {
        logger.info('Request was aborted due to symbol change', {
          component: 'ChartDataSlice',
          action: 'updateSymbol'
        })
      }
    }
  },
  
  // 最新のローソク足を更新（リアルタイムデータ用）
  updateLastCandle: (newCandle: OHLCData) => {
    // 開発環境でのバリデーション
    if (process.env.NODE_ENV !== 'production') {
      const dataResult = validateOHLCData(newCandle)
      if (!dataResult.success) {
        logger.warn('Invalid OHLC data for last candle', {
          component: 'ChartDataSlice',
          action: 'updateLastCandle',
          error: dataResult.error
        })
      }
    }
    
    set((state: ChartDataSliceState) => {
      // 既存のデータ配列を取得
      const data = [...state.data]
      
      // 最後のローソク足を取得
      const lastCandle = data[data.length - 1]
      
      // 同じ時間のローソク足なら更新、そうでなければ追加
      if (lastCandle && lastCandle.time === newCandle.time) {
        // 最後のローソク足を更新
        data[data.length - 1] = newCandle
      } else {
        // 新しいローソク足を追加
        data.push(newCandle)
        
        // データが多すぎる場合は古いものを削除
        if (data.length > 500) {
          data.shift()
        }
      }
      
      return { data } as Partial<T>
    })
  }
}) 