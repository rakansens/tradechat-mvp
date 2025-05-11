// store/chart/useRealTimeStore.ts
// 更新: リアルタイム更新関連の状態管理ストアを最適化
// 
// このストアはリアルタイムデータの更新設定とWebSocket接続を管理します。
// メモ化されたセレクターを使用してパフォーマンスを向上させます。
// 2025-05-07: 重複API呼び出しを防ぐためのデバウンス機能と購読管理を追加

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { RealTimeState } from "../../types/store";
import { ExchangeType } from "../../types/api";
import { OHLCData, Timeframe } from "../../types/chart";
import { useChartDataStore } from "./useChartDataStore";
import { selectCurrentPrice } from "../chart/selectors";
import { logger } from "../../utils/logger";
import { socketService } from "../../services/socket";

// デバウンス関数の実装
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

// 現在のサブスクリプション状態を追跡するためのグローバル変数
type SubscriptionKey = string;
let currentSubscriptions = new Map<SubscriptionKey, boolean>();

// サブスクリプションキーを生成する関数
function getSubscriptionKey(symbol: string, timeframe: Timeframe): SubscriptionKey {
  return `${symbol}:${timeframe}`;
}

// リアルタイム更新ストアの作成
export const useRealTimeStore = create<RealTimeState>()(
  devtools(
    persist(
      (set, get) => ({
        // 状態
        useRealTimeData: true,
        bitgetApi: null,
        lastSubscriptionKey: "",
        
        // 内部メソッド（型定義のため）
        _debouncedStartRealTimeUpdates: () => {},
        _startRealTimeUpdatesImpl: () => {},
        
        // アクション
        startRealTimeUpdates: function() {
          // デバウンスされた実装
          const debouncedImpl = debounce(() => {
            try {
              // 現在のAPIクライアントを取得
              let api = get().bitgetApi || socketService.getCurrentApiClient();
              
              // APIクライアントが初期化されていない場合は初期化する
              if (!api) {
                try {
                  // チャート設定ストアから現在の取引種別を取得
                  const { exchangeType } = require('./useChartConfigStore').useChartConfigStore.getState();
                  get().initializeApi(exchangeType);
                  api = get().bitgetApi;
                  
                  if (!api) {
                    logger.error('API client not initialized', null, {
                      component: 'useRealTimeStore',
                      action: 'startRealTimeUpdates'
                    });
                    return;
                  }
                } catch (e) {
                  logger.error('Failed to initialize API client', e, {
                    component: 'useRealTimeStore',
                    action: 'startRealTimeUpdates'
                  });
                  return;
                }
              }
              
              // チャートデータストアから現在のシンボルとタイムフレームを取得
              const chartDataStore = useChartDataStore.getState();
              const { currentSymbol, currentTimeFrame, updateLastCandle } = chartDataStore;
              
              // 購読キーを生成
              const subscriptionKey = getSubscriptionKey(currentSymbol, currentTimeFrame);
              
              // 既に同じシンボルとタイムフレームを購読している場合は早期リターン
              if (currentSubscriptions.get(subscriptionKey) === true && get().lastSubscriptionKey === subscriptionKey) {
                logger.info('既に購読中のシンボルとタイムフレームです', {
                  component: 'useRealTimeStore',
                  action: 'startRealTimeUpdates',
                  symbol: currentSymbol,
                  timeframe: currentTimeFrame
                });
                return;
              }
              
              // 前の購読をクリーンアップ
              try {
                get().stopRealTimeUpdates();
              } catch (error) {
                logger.warn('前の購読のクリーンアップ中にエラーが発生しました', {
                  component: 'useRealTimeStore',
                  action: 'startRealTimeUpdates',
                  error
                });
                // エラーが発生しても続行する
              }
              
              // 現在の価格をメモ化されたセレクターで取得
              const lastPrice = selectCurrentPrice(chartDataStore);
              
              // WebSocket接続を開始
              if (typeof api.subscribeToKline === 'function') {
                try {
                  api.subscribeToKline(currentSymbol, currentTimeFrame);
                  
                  // 購読状態を更新
                  currentSubscriptions.set(subscriptionKey, true);
                  set({ lastSubscriptionKey: subscriptionKey });
                  
                  logger.info('WebSocket購読を開始しました', {
                    component: 'useRealTimeStore',
                    action: 'startRealTimeUpdates',
                    symbol: currentSymbol,
                    timeframe: currentTimeFrame
                  });
                  
                  // WebSocketからのデータ受信時のコールバックを設定
                  if (typeof api.onKlineUpdate === 'function') {
                    api.onKlineUpdate((data: OHLCData) => {
                      try {
                        // メモ化されたセレクターを使用して最適化
                        const newChartDataStore = useChartDataStore.getState();
                        const currentLastPrice = selectCurrentPrice(newChartDataStore);
                        
                        // 価格が変化した場合のみ更新を実行
                        if (data.close !== currentLastPrice) {
                          updateLastCandle(data);
                        }
                      } catch (error) {
                        logger.error('WebSocketデータ処理中にエラーが発生しました', {
                          component: 'useRealTimeStore',
                          action: 'onKlineUpdate',
                          error
                        });
                      }
                    });
                  } else {
                    logger.error('APIクライアントのonKlineUpdateメソッドが存在しません', null, {
                      component: 'useRealTimeStore',
                      action: 'startRealTimeUpdates'
                    });
                  }
                } catch (error) {
                  logger.error('WebSocket購読開始中にエラーが発生しました', {
                    component: 'useRealTimeStore',
                    action: 'startRealTimeUpdates',
                    error
                  });
                }
              } else {
                logger.error('APIクライアントのsubscribeToKlineメソッドが存在しません', {
                  component: 'useRealTimeStore',
                  action: 'startRealTimeUpdates'
                });
              }
            } catch (error) {
              logger.error('リアルタイム更新の開始中にエラーが発生しました', {
                component: 'useRealTimeStore',
                action: 'startRealTimeUpdates',
                error
              });
            }
          }, 500); // 500msのデバウンス時間
          
          // デバウンスされた実装を呼び出す
          debouncedImpl();
        },
        
        stopRealTimeUpdates: function() {
          try {
            const api = get().bitgetApi;
            if (!api) {
              logger.warn('API client not initialized when trying to stop updates.', {
                component: 'useRealTimeStore',
                action: 'stopRealTimeUpdates',
                note: 'This might be normal during cleanup.'
              });
              return;
            }
            
            // WebSocket接続を停止
            if (typeof api.disconnectWebSocket === 'function') {
              try {
                api.disconnectWebSocket();
                logger.info('WebSocket接続を正常に切断しました', {
                  component: 'useRealTimeStore',
                  action: 'stopRealTimeUpdates'
                });
              } catch (wsError) {
                logger.warn('WebSocket切断中にエラーが発生しました', {
                  component: 'useRealTimeStore',
                  action: 'stopRealTimeUpdates',
                  error: wsError
                });
                // エラーが発生しても続行する
              }
            } else {
              logger.warn('APIクライアントのdisconnectWebSocketメソッドが存在しません', {
                component: 'useRealTimeStore',
                action: 'stopRealTimeUpdates'
              });
            }
            
            // 購読状態をクリア
            currentSubscriptions.clear();
            set({ lastSubscriptionKey: "" });
            
            logger.info('WebSocket購読状態をリセットしました', {
              component: 'useRealTimeStore',
              action: 'stopRealTimeUpdates'
            });
          } catch (error) {
            logger.error('WebSocket切断処理中にエラーが発生しました:', {
              component: 'useRealTimeStore',
              action: 'stopRealTimeUpdates',
              error
            });
          }
        },
        
        toggleRealTimeData: function() {
          const newValue = !get().useRealTimeData;
          set({ useRealTimeData: newValue });
          
          if (newValue) {
            // リアルタイムデータを有効にした場合は更新を開始
            get().startRealTimeUpdates();
          } else {
            // リアルタイムデータを無効にした場合は更新を停止
            get().stopRealTimeUpdates();
          }
        },
        
        initializeApi: function(exchangeType: ExchangeType) {
          try {
            // 共通のソケットサービスを使用してAPIクライアントを初期化
            const newApi = socketService.initializeApiClient(exchangeType);
            set({ bitgetApi: newApi });
            
            // リアルタイムデータが有効な場合はWebSocket接続を開始
            if (get().useRealTimeData) {
              get().startRealTimeUpdates();
            }
          } catch (error) {
            logger.error('API初期化エラー:', error, {
              component: 'useRealTimeStore',
              action: 'initializeApi'
            });
          }
        }
      }),
      {
        name: "real-time-storage",
        partialize: (state: RealTimeState) => ({
          // 永続化する状態のみを選択
          useRealTimeData: state.useRealTimeData
        }),
      }
    ),
    { name: "real-time-store" }
  )
);
