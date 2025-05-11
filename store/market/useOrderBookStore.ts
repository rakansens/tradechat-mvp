// store/market/useOrderBookStore.ts
// 作成: useAppStoreから分離したオーダーブック関連の状態と操作を管理するストア
// 
// このストアはオーダーブックデータと、データの取得状態を管理します。
// 主な機能:
// 1. オーダーブックデータの管理
// 2. データ取得状態の管理
// 3. ポーリング制御
// 4. WebSocketとの連携

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ExchangeType } from '../../types/api';
import { OrderBookData } from '../../types/market';
import { logger } from '../../utils/logger';
import { dataFetchService } from '../../services/dataFetchService';
import { useSymbolStore } from '../useSymbolStore';

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
    (set, get) => ({
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
        const symbolStore = useSymbolStore.getState();
        const finalSymbol = symbol || symbolStore.currentSymbol;
        const finalExchangeType = exchangeType || symbolStore.exchangeType;
        
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
          const orderBook = await dataFetchService.fetchOrderBook(
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
        const symbolStore = useSymbolStore.getState();
        const symbol = symbolStore.currentSymbol;
        const exchangeType = symbolStore.exchangeType;
        
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
          const symbolStore = useSymbolStore.getState();
          const currentSymbol = symbolStore.currentSymbol;
          const currentExchangeType = symbolStore.exchangeType;
          
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
        const symbolStore = useSymbolStore.getState();
        const symbol = symbolStore.currentSymbol;
        const exchangeType = symbolStore.exchangeType;
        
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
        const unsubscribe = dataFetchService.subscribeOrderBookRealtime(
          symbol,
          (data) => {
            // データを受信したらストアを更新
            set({
              orderBook: data,
              isLoadingOrderBook: false,
              orderBookError: null
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
    }),
    { name: 'orderbook-store' }
  )
);

// シンボルストアの変更を監視して自動的に更新する
// コンポーネントのマウント時に一度だけ実行される初期化コード
const initializeSymbolStoreSubscription = () => {
  try {
    // シンボルストアを購読
    const unsubscribe = useSymbolStore.subscribe((state) => {
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

// 初期化を実行
initializeSymbolStoreSubscription();

// デフォルトエクスポート
export default useOrderBookStore;