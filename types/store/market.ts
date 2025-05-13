// types/store/market.ts
// マーケットデータストア関連の型定義

import { ExchangeType } from '../api';

/**
 * マーケットストアの状態
 */
export interface MarketState {
  // 選択されたシンボル
  currentSymbol: string;
  exchangeType: ExchangeType;
  
  // オーダーブック関連
  orderBook: any | null;
  isLoadingOrderBook: boolean;
  orderBookError: string | null;
  
  // 取引履歴関連
  trades: any[];
  isLoadingTrades: boolean;
  tradesError: string | null;
  
  // 市場統計関連
  marketStats: any | null;
  isLoadingMarketStats: boolean;
  marketStatsError: string | null;
  
  // 銘柄情報関連
  symbols: any[];
  isLoadingSymbols: boolean;
  symbolsError: string | null;
  
  // デモモード状態
  isDemoMode: boolean;
  
  // ポーリング状態
  isPolling: boolean;
  pollingInterval: number;
  
  // アクション
  setCurrentSymbol: (symbol: string) => void;
  setExchangeType: (type: ExchangeType) => void;
  fetchOrderBook: (symbolOverride?: string, signal?: AbortSignal) => Promise<void>;
  clearOrderBook: () => void;
  setDemoMode: (isDemo: boolean) => void;
  
  // ポーリング管理アクション
  startPolling: () => void;
  stopPolling: () => void;
  setPollingInterval: (interval: number) => void;
} 