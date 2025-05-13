// store/chart/realTime/actions.ts
// 作成: RealTimeSliceのアクション定義

import type { StateCreator } from "zustand"
import type { ExchangeType } from "@/types/api"
import type { Timeframe, OHLCData } from "@/types/chart"
import type { RealTimeSliceState } from "./state"
import { logger } from '@/utils/common'
import { socketService } from "@/services/socket"

// 購読キーの型定義
type SubscriptionKey = string

// 現在のサブスクリプション状態を追跡するためのグローバル変数
let currentSubscriptions = new Map<SubscriptionKey, boolean>()

// サブスクリプションキーを生成する関数
function getSubscriptionKey(symbol: string, timeframe: Timeframe): SubscriptionKey {
  return `${symbol}:${timeframe}`
}

// デバウンス関数の実装
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
      timeout = null
    }, wait)
  }
}

export interface RealTimeActions {
  // リアルタイム更新を開始するアクション
  startRealTimeUpdates: () => void
  
  // リアルタイム更新を停止するアクション
  stopRealTimeUpdates: () => void
  
  // リアルタイムデータの有効/無効を切り替えるアクション
  toggleRealTimeData: () => void
  
  // APIクライアントを初期化するアクション
  initializeApi: (exchangeType: ExchangeType) => void
}

export type RealTimeSlice = RealTimeSliceState & RealTimeActions

/**
 * リアルタイム更新スライスのアクションを作成する関数
 */
export const createRealTimeActions = <T extends RealTimeSlice>(
  set: (state: Partial<T>) => void,
  get: () => T
): RealTimeActions => {
  // リアルタイム更新の実装（デバウンスされたバージョン）
  const startRealTimeUpdatesImpl = () => {
    try {
      // 現在のAPIクライアントを取得
      let api = get().bitgetApi || socketService.getCurrentApiClient()
      
      // APIクライアントが初期化されていない場合は初期化する
      if (!api) {
        try {
          // 取引種別をローカルストレージから直接取得（循環参照回避のため）
          const exchangeType = typeof window !== 'undefined' 
            ? (localStorage.getItem('lastUsedExchangeType') || localStorage.getItem('selectedInstrumentType') || 'spot') as ExchangeType
            : 'spot';
          get().initializeApi(exchangeType)
          api = get().bitgetApi
          
          if (!api) {
            logger.error('API client not initialized', null, {
              component: 'RealTimeSlice',
              action: 'startRealTimeUpdates'
            })
            return
          }
        } catch (e) {
          logger.error('Failed to initialize API client', e, {
            component: 'RealTimeSlice',
            action: 'startRealTimeUpdates'
          })
          return
        }
      }
      
      // rootStoreから現在のシンボルとタイムフレームを取得（循環参照回避）
      const rootStore = require('@/store/rootStore').useRootStore.getState();
      const currentSymbol = rootStore.currentSymbol;
      const currentTimeFrame = rootStore.currentTimeFrame;
      const updateLastCandle = rootStore.updateLastCandle;
      
      // 購読キーを生成
      const subscriptionKey = getSubscriptionKey(currentSymbol, currentTimeFrame)
      
      // 既に同じシンボルとタイムフレームを購読している場合は早期リターン
      if (currentSubscriptions.get(subscriptionKey) === true && get().lastSubscriptionKey === subscriptionKey) {
        logger.info('既に購読中のシンボルとタイムフレームです', {
          component: 'RealTimeSlice',
          action: 'startRealTimeUpdates',
          symbol: currentSymbol,
          timeframe: currentTimeFrame
        })
        return
      }
      
      // 前の購読をクリーンアップ
      try {
        get().stopRealTimeUpdates()
      } catch (error) {
        logger.warn('前の購読のクリーンアップ中にエラーが発生しました', {
          component: 'RealTimeSlice',
          action: 'startRealTimeUpdates',
          error
        })
        // エラーが発生しても続行する
      }
      
      // WebSocket接続を開始
      if (typeof api.subscribeToKline === 'function') {
        try {
          api.subscribeToKline(currentSymbol, currentTimeFrame)
          
          // 購読状態を更新
          currentSubscriptions.set(subscriptionKey, true)
          set({ lastSubscriptionKey: subscriptionKey } as Partial<T>)
          
          logger.info('WebSocket購読を開始しました', {
            component: 'RealTimeSlice',
            action: 'startRealTimeUpdates',
            symbol: currentSymbol,
            timeframe: currentTimeFrame
          })
          
          // WebSocketからのデータ受信時のコールバックを設定
          if (typeof api.onKlineUpdate === 'function') {
            api.onKlineUpdate((data: OHLCData) => {
              try {
                // 現在の価格を取得して更新
                updateLastCandle(data)
              } catch (error) {
                logger.error('WebSocketデータ処理中にエラーが発生しました', {
                  component: 'RealTimeSlice',
                  action: 'onKlineUpdate',
                  error
                })
              }
            })
          } else {
            logger.error('APIクライアントのonKlineUpdateメソッドが存在しません', null, {
              component: 'RealTimeSlice',
              action: 'startRealTimeUpdates'
            })
          }
        } catch (error) {
          logger.error('WebSocket購読開始中にエラーが発生しました', {
            component: 'RealTimeSlice',
            action: 'startRealTimeUpdates',
            error
          })
        }
      } else {
        logger.error('APIクライアントのsubscribeToKlineメソッドが存在しません', {
          component: 'RealTimeSlice',
          action: 'startRealTimeUpdates'
        })
      }
    } catch (error) {
      logger.error('リアルタイム更新の開始中にエラーが発生しました', {
        component: 'RealTimeSlice',
        action: 'startRealTimeUpdates',
        error
      })
    }
  }
  
  const debouncedStartRealTimeUpdates = debounce(startRealTimeUpdatesImpl, 500)
  
  return {
    startRealTimeUpdates: () => {
      debouncedStartRealTimeUpdates()
    },
    
    stopRealTimeUpdates: () => {
      try {
        const api = get().bitgetApi
        if (!api) {
          logger.warn('API client not initialized when trying to stop updates.', {
            component: 'RealTimeSlice',
            action: 'stopRealTimeUpdates',
            note: 'This might be normal during cleanup.'
          })
          return
        }
        
        // WebSocket接続を停止
        if (typeof api.disconnectWebSocket === 'function') {
          try {
            api.disconnectWebSocket()
            logger.info('WebSocket接続を正常に切断しました', {
              component: 'RealTimeSlice',
              action: 'stopRealTimeUpdates'
            })
          } catch (wsError) {
            logger.warn('WebSocket切断中にエラーが発生しました', {
              component: 'RealTimeSlice',
              action: 'stopRealTimeUpdates',
              error: wsError
            })
            // エラーが発生しても続行する
          }
        } else {
          logger.warn('APIクライアントのdisconnectWebSocketメソッドが存在しません', {
            component: 'RealTimeSlice',
            action: 'stopRealTimeUpdates'
          })
        }
        
        // 購読状態をクリア
        currentSubscriptions.clear()
        set({ lastSubscriptionKey: "" } as Partial<T>)
        
        logger.info('WebSocket購読状態をリセットしました', {
          component: 'RealTimeSlice',
          action: 'stopRealTimeUpdates'
        })
      } catch (error) {
        logger.error('WebSocket切断処理中にエラーが発生しました:', {
          component: 'RealTimeSlice',
          action: 'stopRealTimeUpdates',
          error
        })
      }
    },
    
    toggleRealTimeData: () => {
      const newValue = !get().useRealTimeData
      set({ useRealTimeData: newValue } as Partial<T>)
      
      if (newValue) {
        // リアルタイムデータを有効にした場合は更新を開始
        get().startRealTimeUpdates()
      } else {
        // リアルタイムデータを無効にした場合は更新を停止
        get().stopRealTimeUpdates()
      }
    },
    
    initializeApi: (exchangeType: ExchangeType) => {
      try {
        // 共通のソケットサービスを使用してAPIクライアントを初期化
        const newApi = socketService.initializeApiClient(exchangeType)
        set({ bitgetApi: newApi } as Partial<T>)
        
        // リアルタイムデータが有効な場合はWebSocket接続を開始
        if (get().useRealTimeData) {
          get().startRealTimeUpdates()
        }
      } catch (error) {
        logger.error('API初期化エラー:', error, {
          component: 'RealTimeSlice',
          action: 'initializeApi'
        })
      }
    }
  }
} 