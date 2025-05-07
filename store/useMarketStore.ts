// store/useMarketStore.ts
// オーダーブックと市場データを管理するZustandストア
// 更新: 共通型定義を使用するように変更

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { BitgetApiClient } from '../services/bitgetApi';
import { ExchangeType } from '../types/api';
import { OrderBookData, TradeData, MarketStatsData, SymbolInfo } from '../types/market';
import { logger } from '../utils/logger';

// APIクライアントインスタンス
const api = new BitgetApiClient();

// ストアの状態型定義
interface MarketState {
  // 選択されたシンボル
  currentSymbol: string;
  exchangeType: ExchangeType;
  
  // オーダーブック関連
  orderBook: OrderBookData | null;
  isLoadingOrderBook: boolean;
  orderBookError: string | null;
  
  // 取引履歴関連
  trades: TradeData[];
  isLoadingTrades: boolean;
  tradesError: string | null;
  
  // 市場統計関連
  marketStats: MarketStatsData | null;
  isLoadingMarketStats: boolean;
  marketStatsError: string | null;
  
  // 銘柄情報関連
  symbols: SymbolInfo[];
  isLoadingSymbols: boolean;
  symbolsError: string | null;
  
  // デモモード状態
  isDemoMode: boolean;
  
  // アクション
  setCurrentSymbol: (symbol: string) => void;
  setExchangeType: (type: ExchangeType) => void;
  fetchOrderBook: (signal?: AbortSignal) => Promise<void>;
  clearOrderBook: () => void;
  setDemoMode: (isDemo: boolean) => void;
}

// Zustandストア作成
const useMarketStore = create<MarketState>()(
  devtools(
    (set, get) => ({
      // 初期状態
      currentSymbol: 'BTC/USDT',
      exchangeType: 'spot',
      
      // オーダーブック初期状態
      orderBook: null,
      isLoadingOrderBook: false,
      orderBookError: null,
      
      // 取引履歴初期状態
      trades: [],
      isLoadingTrades: false,
      tradesError: null,
      
      // 市場統計初期状態
      marketStats: null,
      isLoadingMarketStats: false,
      marketStatsError: null,
      
      // 銘柄情報初期状態
      symbols: [],
      isLoadingSymbols: false,
      symbolsError: null,
      
      // デモモード初期状態
      isDemoMode: false,
      
      // 現在のシンボルを設定
      setCurrentSymbol: (symbol: string) => {
        // 現在のシンボルと同じ場合は何もしない
        const currentSymbol = get().currentSymbol;
        if (symbol === currentSymbol) {
          logger.info(`Symbol already set to ${symbol}, skipping update`, {
            component: 'useMarketStore',
            action: 'setCurrentSymbol'
          });
          return;
        }
        
        // ログ出力
        logger.info(`Changing symbol from ${currentSymbol} to ${symbol}`, {
          component: 'useMarketStore',
          action: 'setCurrentSymbol'
        });
        
        // 古いデータをクリアしてからシンボルを設定
        set({
          currentSymbol: symbol,
          orderBook: null,
          trades: [],
          marketStats: null,
          isLoadingOrderBook: false,
          orderBookError: null
        });
        
        // 新しいデータを取得 - 少し遅延させて状態更新が完了してから実行
        setTimeout(() => {
          // 最新のシンボルを再確認（非同期処理中に変更された可能性がある）
          const currentStoreSymbol = get().currentSymbol;
          if (symbol === currentStoreSymbol) {
            logger.info(`Fetching order book for ${symbol}`, {
              component: 'useMarketStore',
              action: 'setCurrentSymbol'
            });
            get().fetchOrderBook();
            // 将来的に実装する他のデータフェッチ関数も呼び出す
            // get().fetchTrades();
            // get().fetchMarketStats();
          } else {
            logger.info(`Symbol changed during async operation from ${symbol} to ${currentStoreSymbol}, skipping fetch`, {
              component: 'useMarketStore',
              action: 'setCurrentSymbol'
            });
          }
        }, 50); // 状態更新後に実行するために少し遅延させる
      },
      
      // 取引種別を設定
      setExchangeType: (type: ExchangeType) => {
        set({ exchangeType: type });
        api.setExchangeType(type);
        
        // 取引種別変更後、データを再取得
        const state = get();
        state.fetchOrderBook();
        // 将来的に実装する他のデータフェッチ関数も呼び出す
        // state.fetchTrades();
        // state.fetchMarketStats();
      },
      
      // オーダーブック取得
      fetchOrderBook: async (signal?: AbortSignal) => {
        const { currentSymbol, exchangeType } = get();
        
        // ローディング状態を設定
        set({ isLoadingOrderBook: true, orderBookError: null });
        
        try {
          // APIからオーダーブックを取得
          const orderBook = await api.getOrderBook(currentSymbol, exchangeType);
          
          // 取得したデータを状態に設定
          set({
            orderBook,
            isLoadingOrderBook: false,
            isDemoMode: false // 正常取得の場合はデモモードをオフ
          });
        } catch (error: any) {
          logger.error('Failed to fetch order book:', error);
          
          // デモモードの生成されたデータを使用
          try {
            const demoOrderBook = await api.getOrderBook(currentSymbol, exchangeType);
            set({
              orderBook: demoOrderBook,
              orderBookError: `${error.message} (デモデータを表示中)`,
              isLoadingOrderBook: false,
              isDemoMode: true // デモモードをオン
            });
          } catch (demoError) {
            // デモデータの取得も失敗した場合
            set({
              orderBookError: `${error.message} (データ取得に失敗しました)`,
              isLoadingOrderBook: false,
              isDemoMode: true
            });
          }
        }
      },
      
      // オーダーブックデータをクリア
      clearOrderBook: () => {
        set({ orderBook: null });
      },
      
      // デモモード設定
      setDemoMode: (isDemo: boolean) => {
        set({ isDemoMode: isDemo });
      }
    }),
    { name: 'market-store' }
  )
);

export default useMarketStore; 