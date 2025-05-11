// store/useAppStore.ts
// 更新: 責務を分散させ、他のストアへの委譲を行うように変更
// 更新: 循環参照を解消するために、useChartDataStoreへの依存を削除
//
// このストアはアプリケーションの初期化と、他のストアの連携を担当します。
// 主な機能:
// 1. アプリケーションの初期化
// 2. 他のストアへの委譲
// 3. 後方互換性の提供

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ExchangeType } from '../types/api';
import { logger } from '../utils/logger';
import { Timeframe } from '../types/chart';
import { useSymbolStore } from './useSymbolStore';
import { useOrderBookStore } from './market/useOrderBookStore';
import { useDataFetchStore } from './useDataFetchStore';
import { useWebSocketStore } from './useWebSocketStore';
import { useDebugStore } from './useDebugStore';

// アプリストアの状態型定義（後方互換性のため）
export interface AppState {
  // アプリケーション初期化
  initializeApp: () => { symbol: string; exchangeType: ExchangeType };
  
  // 他のストアへの委譲メソッド（後方互換性のため）
  // シンボル関連
  currentSymbol: string;
  exchangeType: ExchangeType;
  setCurrentSymbol: (symbol: string, reason?: string) => void;
  setExchangeType: (type: ExchangeType) => void;
  
  // チャート関連
  currentTimeFrame: Timeframe;
  updateTimeFrame: (timeFrame: Timeframe) => Promise<void>;
  
  // デバッグ関連
  isDebugMode: boolean;
  toggleDebugMode: () => void;
  getActiveFetchesInfo: () => any[];
  getPollingStatus: () => any;
  getSymbolChangeHistory: () => any[];
  getWebSocketStatus: () => { connected: boolean; subscriptions: { orderbook: boolean; chart: boolean } };
  
  // WebSocket関連
  wsConnected: boolean;
  unsubscribeAllWebSockets: () => void;
  
  // データフェッチ関連
  cancelFetch: (type: 'orderbook' | 'chart' | 'trades', symbol?: string) => void;
  cancelAllFetches: () => void;
}

// ローカルストレージから時間足を取得する関数
const getTimeframeFromLocalStorage = (): Timeframe => {
  if (typeof window === 'undefined') return '15m';
  
  const lastUsedTimeframeValue = localStorage.getItem('lastUsedTimeframe');
  const selectedTimeframeValue = localStorage.getItem('selectedTimeframe');
  
  // selectedTimeframeを優先する（これが最新の値）
  const storedTimeframe = selectedTimeframeValue || lastUsedTimeframeValue;
  
  if (storedTimeframe && ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'].includes(storedTimeframe)) {
    return storedTimeframe as Timeframe;
  }
  
  return '15m'; // デフォルト値
};

// Zustandストア作成
export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // 他のストアから値を取得するためのゲッター
      get currentSymbol() {
        return useSymbolStore.getState().currentSymbol;
      },
      
      get exchangeType() {
        return useSymbolStore.getState().exchangeType;
      },
      
      // 循環参照を避けるため、ローカルストレージから直接取得
      get currentTimeFrame() {
        return getTimeframeFromLocalStorage();
      },
      
      get isDebugMode() {
        return useDebugStore.getState().isDebugMode;
      },
      
      get wsConnected() {
        return useWebSocketStore.getState().wsConnected;
      },
      
      // 他のストアへの委譲メソッド
      setCurrentSymbol: (symbol: string, reason?: string) => {
        useSymbolStore.getState().setCurrentSymbol(symbol, reason);
      },
      
      setExchangeType: (type: ExchangeType) => {
        useSymbolStore.getState().setExchangeType(type);
      },
      
      // 循環参照を避けるため、ローカルストレージに直接保存
      updateTimeFrame: async (timeFrame: Timeframe) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastUsedTimeframe', timeFrame);
          localStorage.setItem('selectedTimeframe', timeFrame); // 互換性のため
          
          logger.info(`タイムフレームをローカルストレージに保存しました: ${timeFrame}`, {
            component: 'useAppStore',
            action: 'updateTimeFrame'
          });
        }
        
        // 実際のチャートデータの更新は、useChartDataStoreがローカルストレージの変更を
        // 検出して行うため、ここでは何もしない
        return Promise.resolve();
      },
      
      toggleDebugMode: () => {
        useDebugStore.getState().toggleDebugMode();
      },
      
      getActiveFetchesInfo: () => {
        return useDebugStore.getState().getActiveFetchesInfo();
      },
      
      getPollingStatus: () => {
        return useDebugStore.getState().getPollingStatus();
      },
      
      getSymbolChangeHistory: () => {
        return useDebugStore.getState().getSymbolChangeHistory();
      },
      
      getWebSocketStatus: () => {
        return useDebugStore.getState().getWebSocketStatus();
      },
      
      unsubscribeAllWebSockets: () => {
        useWebSocketStore.getState().unsubscribeAllWebSockets();
      },
      
      cancelFetch: (type: 'orderbook' | 'chart' | 'trades', symbol?: string) => {
        useDataFetchStore.getState().cancelFetch(type, symbol);
      },
      
      cancelAllFetches: () => {
        useDataFetchStore.getState().cancelAllFetches();
      },
      
      // アプリケーション初期化
      initializeApp: () => {
        try {
          // 最後に使用したシンボル、取引種別、時間足を取得
          const symbolStore = useSymbolStore.getState();
          let lastUsedSymbol = symbolStore.currentSymbol;
          let lastUsedExchangeType: ExchangeType = 'spot'; // デフォルト値を'spot'に設定
          
          // ローカルストレージから値を取得（ブラウザ環境の場合）
          if (typeof window !== 'undefined') {
            // シンボルの取得
            const storedSymbol = localStorage.getItem('lastUsedSymbol');
            if (storedSymbol) {
              lastUsedSymbol = storedSymbol;
            }
            
            // 取引種別の取得（複数のキーをチェック）
            const storedExchangeType =
              localStorage.getItem('lastUsedExchangeType') ||
              localStorage.getItem('selectedInstrumentType');
              
            if (storedExchangeType && (storedExchangeType === 'spot' || storedExchangeType === 'futures')) {
              lastUsedExchangeType = storedExchangeType as ExchangeType;
              logger.info(`ローカルストレージから取引種別を読み込みました: ${lastUsedExchangeType}`, {
                component: 'useAppStore',
                action: 'initializeApp'
              });
            }
          }
          
          // シンボルが空の場合はデフォルト値を設定
          if (!lastUsedSymbol) {
            lastUsedSymbol = 'BTCUSDT';
            
            logger.info(`シンボルが見つかりません、デフォルト値を設定します: ${lastUsedSymbol}`, {
              component: 'useAppStore',
              action: 'initializeApp'
            });
          }
          
          // 取引種別が空の場合はデフォルト値を設定
          if (!lastUsedExchangeType) {
            lastUsedExchangeType = 'spot';
            
            logger.info(`取引種別が見つかりません、デフォルト値を設定します: ${lastUsedExchangeType}`, {
              component: 'useAppStore',
              action: 'initializeApp'
            });
          }
          
          // 各ストアを初期化
          symbolStore.setExchangeType(lastUsedExchangeType);
          symbolStore.setCurrentSymbol(lastUsedSymbol);
          
          // オーダーブックを取得
          useOrderBookStore.getState().fetchOrderBook(lastUsedSymbol, lastUsedExchangeType);
          
          logger.info(`Initializing app with symbol: ${lastUsedSymbol}, exchange type: ${lastUsedExchangeType}`, {
            component: 'useAppStore',
            action: 'initializeApp'
          });
          
          // 初期化結果を返す
          return {
            symbol: lastUsedSymbol,
            exchangeType: lastUsedExchangeType
          };
        } catch (error) {
          logger.error(`Failed to initialize app: ${error}`, {
            component: 'useAppStore',
            action: 'initializeApp',
            error
          });
          
          // エラー時はデフォルト値を返す
          return {
            symbol: 'BTCUSDT',
            exchangeType: 'spot'
          };
        }
      }
    }),
    { name: 'app-store' }
  )
);

// デフォルトエクスポート
export default useAppStore;
