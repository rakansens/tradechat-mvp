// store/market/state.ts
// 初期実装: マーケットスライスの状態と初期値を定義
// 更新: 2025-06-01 - OrderBookStoreの状態を統合

import type { ExchangeType } from '@/types/api'
import type { OrderBookData, TradeData, MarketStatsData, SymbolInfo } from '@/types/market'

// ポーリング情報の型定義
export interface PollingInfo {
  active: boolean
  lastPollTime: number | null
  interval: number
  type: string
}

// オーダーブックポーリング情報の型定義
export interface OrderBookPollingInfo {
  active: boolean
  lastPollTime: number | null
  interval: number
  type: string
}

// マーケットスライスの状態インターフェース
export interface MarketSliceState {
  // シンボル関連
  currentSymbol: string
  exchangeType: ExchangeType
  
  // オーダーブック関連
  orderBook: OrderBookData | null
  isLoadingOrderBook: boolean
  orderBookError: string | null
  
  // OrderBookStore統合: WebSocket関連
  ws: {
    subscribed: boolean
  }
  
  // OrderBookStore統合: ポーリング情報
  polling: OrderBookPollingInfo
  
  // 取引履歴関連
  trades: TradeData[]
  isLoadingTrades: boolean
  tradesError: string | null
  
  // 市場統計関連
  marketStats: MarketStatsData | null
  isLoadingMarketStats: boolean
  marketStatsError: string | null
  
  // シンボル情報関連
  symbols: SymbolInfo[]
  isLoadingSymbols: boolean
  symbolsError: string | null
  
  // ポーリング状態
  pollingInfo: PollingInfo
  isPolling: boolean
  pollingInterval: number
  
  // その他の設定
  isDemoMode: boolean
}

// マーケットスライスの初期状態
export const initialMarketState: MarketSliceState = {
  // シンボル関連
  currentSymbol: 'BTC-USDT',
  exchangeType: 'spot',
  
  // オーダーブック関連
  orderBook: null,
  isLoadingOrderBook: false,
  orderBookError: null,
  
  // OrderBookStore統合: WebSocket関連
  ws: {
    subscribed: false
  },
  
  // OrderBookStore統合: ポーリング情報
  polling: {
    active: false,
    lastPollTime: null,
    interval: 30000, // 30秒
    type: 'orderbook'
  },
  
  // 取引履歴関連
  trades: [],
  isLoadingTrades: false,
  tradesError: null,
  
  // 市場統計関連
  marketStats: null,
  isLoadingMarketStats: false,
  marketStatsError: null,
  
  // シンボル情報関連
  symbols: [],
  isLoadingSymbols: false,
  symbolsError: null,
  
  // ポーリング状態
  pollingInfo: {
    active: false,
    lastPollTime: null,
    interval: 30000, // 30秒
    type: 'market'
  },
  isPolling: false,
  pollingInterval: 30000, // 30秒
  
  // その他の設定
  isDemoMode: false
} 