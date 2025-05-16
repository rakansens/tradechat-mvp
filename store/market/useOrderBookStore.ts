/**
 * store/market/useOrderBookStore.ts
 * 
 * @deprecated このストアは非推奨です。代わりにMarketSliceを使用してください：
 * - オーダーブックデータ: useRootStore(selectOrderBook)
 * - オーダーブック取得: useRootStore(state => state.fetchOrderBook())
 * - ポーリング開始: useRootStore(state => state.startOrderBookPolling())
 * - WebSocket購読: useRootStore(state => state.subscribeOrderBookWebSocket())
 * - オーダーブック状態: useRootStore(selectIsLoadingOrderBook)
 * - オーダーブックエラー: useRootStore(selectOrderBookError)
 * - WebSocket解除: useRootStore(state => state.unsubscribeOrderBookWebSocket())
 * - ポーリング停止: useRootStore(state => state.stopOrderBookPolling())
 * 
 * 2025-06-01 - MarketSliceに統合され、rootStoreからアクセス可能になりました
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { OrderBookData } from '@/types/market';
import { ExchangeType } from '@/types/constants/enums';
import { orderBookService } from '@/services/data';
import { logger } from '@/utils/common';

// rootStoreからエクスポート
export * from '../rootStore';

// 元コードはMarketSliceに移行しました
// このファイルは互換性のためだけに残されています

// ポーリング情報の型定義
export interface PollingInfo {
  active: boolean;
  lastPollTime: number | null;
  interval: number;
  type: string;
}

// オーダーブックストアの状態型定義
export interface OrderBookState {
  // オーダーブック関連の状態
  orderBook: OrderBookData | null;
  isLoadingOrderBook: boolean;
  orderBookError: string | null;
  
  // ポーリング状態
  pollingInfo: PollingInfo;
  _pollingActive: boolean;
  _pollingTimer: NodeJS.Timeout | null;
  
  // WebSocket関連の状態
  wsSubscribed: boolean;
  _wsUnsubscribeFunction: (() => void) | null;
  
  // オーダーブック関連のアクション
  fetchOrderBook: (symbol?: string, exchangeType?: ExchangeType) => Promise<void>;
  startOrderBookPolling: () => void;
  stopOrderBookPolling: () => void;
  
  // WebSocket関連のアクション
  subscribeOrderBookWebSocket: () => void;
  unsubscribeOrderBookWebSocket: () => void;
}

// ポーリング間隔（ミリ秒）
const POLLING_INTERVAL = 30000; // 30秒

// Zustandストア作成
export const useOrderBookStore = create<OrderBookState>()(
  devtools(
    (set, get) => {
      // useRootStoreを関数内で取得（循環参照を避けるため）
      const getRootStore = () => {
        // 必要な時にだけインポート
        const { useRootStore } = require('../rootStore');
        return useRootStore;
      };

      return {
      // 初期状態 - オーダーブック関連
      orderBook: null,
      isLoadingOrderBook: false,
      orderBookError: null,
      
      // ポーリング状態
      pollingInfo: {
        active: false,
        lastPollTime: null,
        interval: POLLING_INTERVAL,
        type: 'orderbook'
      },
      _pollingActive: false,
      _pollingTimer: null,
      
      // WebSocket関連の状態
      wsSubscribed: false,
      _wsUnsubscribeFunction: null,
      
      // オーダーブックデータを取得
      fetchOrderBook: async (symbol?: string, exchangeType?: ExchangeType) => {
        // 最新の状態を取得
          const rootStore = getRootStore().getState();
          const finalSymbol = symbol || rootStore.currentSymbol;
          const finalExchangeType = exchangeType || rootStore.exchangeType;
        
        // シンボルが空の場合は何もしない
        if (!finalSymbol) {
          logger.warn('Cannot fetch orderbook with empty symbol', {
            component: 'useOrderBookStore',
            action: 'fetchOrderBook'
          });
          return;
        }
        
        set({ isLoadingOrderBook: true, orderBookError: null });
        
        try {
          logger.info(`Fetching order book for ${finalSymbol}`, {
            component: 'useOrderBookStore',
            action: 'fetchOrderBook'
          });
          
          // 共通サービスを使用してオーダーブックを取得
          const orderBook = await orderBookService.getOrderBook(
            finalSymbol,
            finalExchangeType
          );
          
          // 状態を更新
          set({
            orderBook,
            isLoadingOrderBook: false
          });
        } catch (error: any) {
          // エラーハンドリング
          logger.error(`オーダーブック取得エラー: ${error.message}`, {
            component: 'useOrderBookStore',
            action: 'fetchOrderBook',
            symbol: finalSymbol,
            error
          });
          
          set({
            isLoadingOrderBook: false,
            orderBookError: error instanceof Error ? error.message : 'オーダーブックの取得に失敗しました'
          });
        }
      },
      
      // オーダーブックのポーリングを開始
      startOrderBookPolling: () => {
        // 既存のポーリングを停止
        get().stopOrderBookPolling();
        
        // シンボルストアから現在のシンボルを取得
          const rootStore = getRootStore().getState();
          const symbol = rootStore.currentSymbol;
          const exchangeType = rootStore.exchangeType;
        
        // シンボルが空の場合はポーリングを開始しない
        if (!symbol) {
          logger.info(`Cannot start polling with empty symbol`, {
            component: 'useOrderBookStore',
            action: 'startOrderBookPolling'
          });
          return;
        }
        
        // ポーリングアクティブフラグをオンに
        set(state => ({
          _pollingActive: true,
          pollingInfo: {
            ...state.pollingInfo,
            active: true,
            lastPollTime: Date.now()
          }
        }));
        
        logger.info(`Starting order book polling for ${symbol}`, {
          component: 'useOrderBookStore',
          action: 'startOrderBookPolling'
        });
        
        // ポーリング関数
        const poll = async () => {
          // ポーリングが停止されているか確認
          if (!get()._pollingActive) {
            logger.info('Polling is inactive, exiting poll function', {
              component: 'useOrderBookStore',
              action: 'orderBookPoll'
            });
            return;
          }
          
          // 最新の状態を取得
            const rootStore = getRootStore().getState();
            const currentSymbol = rootStore.currentSymbol;
            const currentExchangeType = rootStore.exchangeType;
          
          // シンボルが変更されている場合はポーリングを停止
          if (symbol !== currentSymbol) {
            logger.info(`Symbol changed from ${symbol} to ${currentSymbol}, stopping order book polling`, {
              component: 'useOrderBookStore',
              action: 'orderBookPoll'
            });
            get().stopOrderBookPolling();
            return;
          }
          
          try {
            // データ取得
            await get().fetchOrderBook(currentSymbol, currentExchangeType);
            
            // 次回のポーリングをスケジュール
            if (get()._pollingActive) {
              // ポーリング情報を更新
              set(state => ({
                pollingInfo: {
                  ...state.pollingInfo,
                  lastPollTime: Date.now()
                }
              }));
              
              const timer = setTimeout(() => {
                // 最新の状態を再確認
                if (get()._pollingActive) {
                  poll();
                }
              }, POLLING_INTERVAL);
              
              // タイマーを保存
              set({ _pollingTimer: timer });
            }
          } catch (error) {
            logger.error(`Error during order book polling: ${error}`, {
              component: 'useOrderBookStore',
              action: 'orderBookPoll',
              error
            });
            
            // エラーが発生してもポーリングを継続
            if (get()._pollingActive) {
              const timer = setTimeout(() => {
                // 最新の状態を再確認
                if (get()._pollingActive) {
                  poll();
                }
              }, POLLING_INTERVAL);
              
              // タイマーを保存
              set({ _pollingTimer: timer });
            }
          }
        };
        
        // 初回ポーリングを開始
        poll();
      },
      
      // オーダーブックのポーリングを停止
      stopOrderBookPolling: () => {
        logger.info(`Stopping order book polling`, {
          component: 'useOrderBookStore',
          action: 'stopOrderBookPolling'
        });
        
        // ポーリングアクティブフラグをオフに
        set(state => ({
          _pollingActive: false,
          pollingInfo: {
            ...state.pollingInfo,
            active: false
          }
        }));
        
        // タイマーをクリア
        const { _pollingTimer } = get();
        if (_pollingTimer) {
          clearTimeout(_pollingTimer);
          set({ _pollingTimer: null });
        }
      },
      
      // WebSocketを使用してオーダーブックを購読
      subscribeOrderBookWebSocket: () => {
        // 既存の購読を解除
        get().unsubscribeOrderBookWebSocket();
        
        // シンボルストアから現在のシンボルを取得
          const rootStore = getRootStore().getState();
          const symbol = rootStore.currentSymbol;
          const exchangeType = rootStore.exchangeType;
        
        // シンボルが空の場合は購読しない
        if (!symbol) {
          logger.info(`Cannot subscribe to WebSocket with empty symbol`, {
            component: 'useOrderBookStore',
            action: 'subscribeOrderBookWebSocket'
          });
          return;
        }
        
        logger.info(`Subscribing to order book WebSocket for ${symbol}`, {
          component: 'useOrderBookStore',
          action: 'subscribeOrderBookWebSocket'
        });
        
        // WebSocketを使用してオーダーブックを購読
        const unsubscribe = orderBookService.subscribeOrderBookRealtime(
          symbol,
          (data) => {
            // データを受信したらストアを更新
            set({
              orderBook: data,
              isLoadingOrderBook: false,
              pollingInfo: {
                ...get().pollingInfo,
                lastPollTime: Date.now()
              }
            });
          },
          exchangeType
        );
        
        // 購読状態を更新
        set({
          wsSubscribed: true,
          _wsUnsubscribeFunction: unsubscribe
        });
      },
      
      // WebSocketの購読を解除
      unsubscribeOrderBookWebSocket: () => {
        const { _wsUnsubscribeFunction } = get();
        
        if (_wsUnsubscribeFunction) {
          // 購読を解除
          _wsUnsubscribeFunction();
          
          logger.info(`Unsubscribed from order book WebSocket`, {
            component: 'useOrderBookStore',
            action: 'unsubscribeOrderBookWebSocket'
          });
          
          // 状態を更新
          set({
            wsSubscribed: false,
            _wsUnsubscribeFunction: null
          });
        }
      }
      };
    },
    {
      name: 'order-book-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);

// シンボルストアの変更を監視して自動的に更新する
// コンポーネントのマウント時に一度だけ実行される初期化コード
export const initializeSymbolStoreSubscription = () => {
  // サーバーサイドレンダリング中は実行しない
  if (typeof window === 'undefined') {
    logger.info('SSRモードでは購読を初期化しません', {
      component: 'useOrderBookStore',
      action: 'initializeSymbolStoreSubscription'
    });
    return;
  }
  
  try {
    // useRootStoreを遅延インポート（importを非同期で使用）
    // 循環参照を避けるため、setTimeout内で実行
    setTimeout(() => {
      // 必要な時だけ動的にインポート
      const rootStore = require('../rootStore');
      
    // シンボルストアを購読
      const unsubscribe = rootStore.useRootStore.subscribe((state: any) => {
      const orderBookStore = useOrderBookStore.getState();
      
      // シンボルが変更された場合はオーダーブックを更新
      if (state.currentSymbol) {
        // WebSocketが購読されている場合は再購読
        if (orderBookStore.wsSubscribed) {
          orderBookStore.subscribeOrderBookWebSocket();
        }
        
        // ポーリングがアクティブな場合は再開
        if (orderBookStore.pollingInfo.active) {
          orderBookStore.startOrderBookPolling();
        }
        
        // オーダーブックを取得
        orderBookStore.fetchOrderBook(state.currentSymbol, state.exchangeType);
      }
    });
    }, 0);
    
    // 購読解除関数は返さない（アプリケーションのライフサイクル全体で有効）
    logger.info(`Successfully initialized SymbolStore subscription`, {
      component: 'useOrderBookStore',
      action: 'initializeSymbolStoreSubscription'
    });
  } catch (error) {
    logger.error(`Failed to initialize SymbolStore subscription: ${error}`, {
      component: 'useOrderBookStore',
      action: 'initializeSymbolStoreSubscription',
      error
    });
  }
};

// 直接初期化せず、エクスポートした関数をクライアントコンポーネントから呼び出す
// initializeSymbolStoreSubscription();

// デフォルトエクスポート
export default useOrderBookStore;
