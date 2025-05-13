// store/market/actions.ts
// 初期実装: マーケットスライスのアクション

import type { ExchangeType } from '@/types/api'
import type { OrderBookData, TradeData, MarketStatsData } from '@/types/market'
import type { MarketSliceState } from './state'
import { orderBookService } from '@/services/data'
import { logger } from '@/utils/common'

// 一時的なスタブサービス（実際の実装では適切なサービスに置き換え）
const tradeService = {
  getTrades: async (symbol: string, exchangeType: ExchangeType): Promise<TradeData[]> => {
    // スタブ実装
    return []
  }
}

const marketService = {
  getMarketStats: async (symbol: string, exchangeType: ExchangeType): Promise<MarketStatsData> => {
    // スタブ実装
    return {
      symbol,
      lastPrice: 0,
      priceChangePercent24h: 0,
      volume24h: 0,
      high24h: 0,
      low24h: 0,
      timestamp: Date.now()
    }
  }
}

const symbolService = {
  getSymbols: async (exchangeType: ExchangeType) => {
    // スタブ実装
    return []
  }
}

// マーケットスライスのアクション定義
export interface MarketSliceActions {
  // シンボル管理
  setCurrentSymbol: (symbol: string) => void
  setExchangeType: (type: ExchangeType) => void
  
  // データ取得アクション
  fetchOrderBook: (symbolOverride?: string) => Promise<void>
  fetchTrades: (symbolOverride?: string) => Promise<void>
  fetchMarketStats: (symbolOverride?: string) => Promise<void>
  fetchSymbols: () => Promise<void>
  
  // ポーリング管理
  startPolling: () => void
  stopPolling: () => void
  setPollingInterval: (interval: number) => void
  
  // その他設定
  setDemoMode: (isDemo: boolean) => void

  // OrderBookStore統合: WebSocket関連
  subscribeOrderBookWebSocket: () => void
  unsubscribeOrderBookWebSocket: () => void

  // OrderBookStore統合: オーダーブックポーリング関連
  startOrderBookPolling: () => void
  stopOrderBookPolling: () => void
}

// マーケットスライスのアクション作成関数
export const createMarketActions = (
  set: (fn: (state: MarketSliceState) => void) => void,
  get: () => MarketSliceState
): MarketSliceActions => {
  // ポーリングタイマーのクロージャー
  let pollingTimer: NodeJS.Timeout | null = null;
  
  // ポーリング停止ヘルパー関数
  const stopPollingHelper = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
    
    set((state) => {
      state.isPolling = false;
      state.pollingInfo = {
        ...state.pollingInfo,
        active: false
      };
    });
  };
  
  return {
    // シンボル管理
    setCurrentSymbol: (symbol) => {
      set((state) => {
        state.currentSymbol = symbol
        
        // シンボル変更時に既存のポーリングを停止
        if (state.isPolling) {
          stopPollingHelper();
        }
      })
    },
    
    setExchangeType: (type) => {
      set((state) => {
        state.exchangeType = type
      })
    },
    
    // データ取得アクション
    fetchOrderBook: async (symbolOverride) => {
      const state = get()
      const symbol = symbolOverride || state.currentSymbol
      const exchangeType = state.exchangeType
      
      // シンボルが空の場合は何もしない
      if (!symbol) {
        logger.warn('Cannot fetch orderbook with empty symbol', {
          component: 'MarketSlice',
          action: 'fetchOrderBook'
        })
        return
      }
      
      set((state) => {
        state.isLoadingOrderBook = true
        state.orderBookError = null
      })
      
      try {
        logger.info(`Fetching order book for ${symbol}`, {
          component: 'MarketSlice',
          action: 'fetchOrderBook'
        })
        
        // サービスを使用してオーダーブックを取得
        const orderBook = await orderBookService.getOrderBook(symbol, exchangeType)
        
        set((state) => {
          state.orderBook = orderBook
          state.isLoadingOrderBook = false
          
          // ポーリング情報の更新
          if (state.isPolling) {
            state.pollingInfo = {
              ...state.pollingInfo,
              lastPollTime: Date.now()
            }
          }
        })
      } catch (error: any) {
        logger.error(`オーダーブック取得エラー: ${error.message}`, {
          component: 'MarketSlice',
          action: 'fetchOrderBook',
          symbol,
          error
        })
        
        set((state) => {
          state.isLoadingOrderBook = false
          state.orderBookError = error instanceof Error ? error.message : 'オーダーブックの取得に失敗しました'
        })
      }
    },
    
    fetchTrades: async (symbolOverride) => {
      const state = get()
      const symbol = symbolOverride || state.currentSymbol
      const exchangeType = state.exchangeType
      
      // シンボルが空の場合は何もしない
      if (!symbol) {
        logger.warn('Cannot fetch trades with empty symbol', {
          component: 'MarketSlice',
          action: 'fetchTrades'
        })
        return
      }
      
      set((state) => {
        state.isLoadingTrades = true
        state.tradesError = null
      })
      
      try {
        logger.info(`Fetching trades for ${symbol}`, {
          component: 'MarketSlice',
          action: 'fetchTrades'
        })
        
        // サービスを使用して取引履歴を取得
        const trades = await tradeService.getTrades(symbol, exchangeType)
        
        set((state) => {
          state.trades = trades
          state.isLoadingTrades = false
        })
      } catch (error: any) {
        logger.error(`取引履歴取得エラー: ${error.message}`, {
          component: 'MarketSlice',
          action: 'fetchTrades',
          symbol,
          error
        })
        
        set((state) => {
          state.isLoadingTrades = false
          state.tradesError = error instanceof Error ? error.message : '取引履歴の取得に失敗しました'
        })
      }
    },
    
    fetchMarketStats: async (symbolOverride) => {
      const state = get()
      const symbol = symbolOverride || state.currentSymbol
      const exchangeType = state.exchangeType
      
      // シンボルが空の場合は何もしない
      if (!symbol) {
        logger.warn('Cannot fetch market stats with empty symbol', {
          component: 'MarketSlice',
          action: 'fetchMarketStats'
        })
        return
      }
      
      set((state) => {
        state.isLoadingMarketStats = true
        state.marketStatsError = null
      })
      
      try {
        logger.info(`Fetching market stats for ${symbol}`, {
          component: 'MarketSlice',
          action: 'fetchMarketStats'
        })
        
        // サービスを使用して市場統計を取得
        const marketStats = await marketService.getMarketStats(symbol, exchangeType)
        
        set((state) => {
          state.marketStats = marketStats
          state.isLoadingMarketStats = false
        })
      } catch (error: any) {
        logger.error(`市場統計取得エラー: ${error.message}`, {
          component: 'MarketSlice',
          action: 'fetchMarketStats',
          symbol,
          error
        })
        
        set((state) => {
          state.isLoadingMarketStats = false
          state.marketStatsError = error instanceof Error ? error.message : '市場統計の取得に失敗しました'
        })
      }
    },
    
    fetchSymbols: async () => {
      const state = get()
      const exchangeType = state.exchangeType
      
      set((state) => {
        state.isLoadingSymbols = true
        state.symbolsError = null
      })
      
      try {
        logger.info(`Fetching symbols for ${exchangeType}`, {
          component: 'MarketSlice',
          action: 'fetchSymbols'
        })
        
        // サービスを使用してシンボル一覧を取得
        const symbols = await symbolService.getSymbols(exchangeType)
        
        set((state) => {
          state.symbols = symbols
          state.isLoadingSymbols = false
        })
      } catch (error: any) {
        logger.error(`シンボル一覧取得エラー: ${error.message}`, {
          component: 'MarketSlice',
          action: 'fetchSymbols',
          exchangeType,
          error
        })
        
        set((state) => {
          state.isLoadingSymbols = false
          state.symbolsError = error instanceof Error ? error.message : 'シンボル一覧の取得に失敗しました'
        })
      }
    },
    
    // ポーリング管理
    startPolling: () => {
      // 既存のポーリングを停止
      stopPollingHelper();
      
      set((state) => {
        state.isPolling = true
        state.pollingInfo = {
          ...state.pollingInfo,
          active: true,
          lastPollTime: Date.now()
        }
      })
      
      logger.info(`Starting market data polling`, {
        component: 'MarketSlice',
        action: 'startPolling'
      })
      
      // ポーリング実装（オーダーブックのポーリング例）
      const pollData = async () => {
        const state = get();
        if (!state.isPolling) return;
        
        try {
          // 各データを順番に取得
          await state.currentSymbol && createMarketActions(set, get).fetchOrderBook();
          await state.currentSymbol && createMarketActions(set, get).fetchTrades();
          await state.currentSymbol && createMarketActions(set, get).fetchMarketStats();
        } catch (err: any) {
          logger.error(`ポーリングエラー: ${err.message}`, {
            component: 'MarketSlice',
            action: 'pollData'
          });
        }
      };
      
      // 最初のデータ取得を即座に実行
      pollData();
      
      // 定期的なポーリングをスケジュール
      const interval = get().pollingInterval;
      pollingTimer = setInterval(pollData, interval);
    },
    
    stopPolling: () => {
      stopPollingHelper();
      
      logger.info(`Stopping market data polling`, {
        component: 'MarketSlice',
        action: 'stopPolling'
      })
    },
    
    setPollingInterval: (interval) => {
      set((state) => {
        state.pollingInterval = interval
        state.pollingInfo = {
          ...state.pollingInfo,
          interval: interval
        }
      })
      
      // ポーリングが活性化している場合は再起動
      const state = get();
      if (state.isPolling) {
        // 既存のポーリングを停止
        stopPollingHelper();
        
        // 新しい間隔でポーリングを開始（このオブジェクトのstartPollingメソッドを呼び出す）
        setTimeout(() => {
          const actions = createMarketActions(set, get);
          actions.startPolling();
        }, 0);
      }
    },
    
    // その他設定
    setDemoMode: (isDemo) => {
      set((state) => {
        state.isDemoMode = isDemo
      })
    },

    // OrderBookStore統合: WebSocket関連
    subscribeOrderBookWebSocket: () => {
      // 実装が必要
    },

    unsubscribeOrderBookWebSocket: () => {
      // 実装が必要
    },

    // OrderBookStore統合: オーダーブックポーリング関連
    startOrderBookPolling: () => {
      // 実装が必要
    },

    stopOrderBookPolling: () => {
      // 実装が必要
    }
  };
} 