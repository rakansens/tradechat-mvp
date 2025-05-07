// store/useMarketStore.ts
// オーダーブックと市場データを管理するZustandストア
// 更新: 循環参照問題の解決
// - シンボルストアとの循環参照を解消するために動的インポートを使用
// - 初期化時の依存関係を遅延評価に変更
// - エラーハンドリングを強化

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { BitgetApiClient } from '../services/bitgetApi';
import { dataFetchService } from '../services/dataFetchService';
import { ExchangeType } from '../types/api';
import { OrderBookData, TradeData } from '../types/market';
import { logger } from '../utils/logger';
// 循環参照を解消するために直接インポートを削除
// 型定義のみインポート
import type { SymbolState } from './useSymbolStore';

// APIクライアントのインスタンス
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
  
  // リクエストキャンセル用
  _abortController: AbortController | null;
  
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

// デフォルトの初期値
const defaultInitialState = {
  currentSymbol: 'BTC/USDT',
  exchangeType: 'spot' as ExchangeType
};

// Zustandストア作成
export const useMarketStore = create<MarketState>()(
  devtools(
    (set, get) => ({
      // 初期状態
      currentSymbol: defaultInitialState.currentSymbol,
      exchangeType: defaultInitialState.exchangeType,
      
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
      
      // ポーリング初期状態
      isPolling: false,
      pollingInterval: 10000, // 10秒間隔
      
      // 現在のシンボルを設定
      setCurrentSymbol: (symbol: string) => {
        // シンボルストアを使用してシンボルを更新
        // これにより、シンボル管理が一元化される
        import('./useSymbolStore').then(symbolStoreModule => {
          symbolStoreModule.useSymbolStore.getState().setCurrentSymbol(symbol);
        }).catch(error => {
          logger.error(`Failed to update symbol in symbol store: ${error}`, {
            component: 'useMarketStore',
            action: 'setCurrentSymbol',
            error
          });
        });
        
        // 自身のストア状態も更新（UIの即時反映のため）
        const abortController = new AbortController();
        
        // シンボルを正規化
        const normalizedSymbol = symbol.replace('/', '');
        
        logger.info(`Setting current symbol to ${symbol} (normalized: ${normalizedSymbol})`, {
          component: 'useMarketStore',
          action: 'setCurrentSymbol'
        });
        
        // 古いデータをクリアしてからシンボルを設定
        set({
          currentSymbol: symbol,
          orderBook: { asks: [], bids: [], symbol: symbol, timestamp: Date.now() },
          trades: [],
          orderBookError: null,
          isLoadingOrderBook: true,
          _abortController: abortController
        });
        
        // 必ず停止してから再開始（ポーリングの信頼性向上）
        get().stopPolling();
        
        // 確実に停止されるまで少し待つ
        setTimeout(() => {
          // 最新のシンボルを取得（非同期処理中に変更された可能性がある）
          const latestSymbol = get().currentSymbol;
          const normalizedLatestSymbol = latestSymbol.replace('/', '');
          
          logger.info(`Checking latest symbol before fetch: ${latestSymbol} (normalized: ${normalizedLatestSymbol})`, {
            component: 'useMarketStore',
            action: 'setCurrentSymbol'
          });
          
          // 明示的に正規化したシンボルでデータ取得
          get().fetchOrderBook(normalizedLatestSymbol, abortController.signal);
          
          // ポーリングを再開
          logger.info(`Starting polling for ${latestSymbol}`, {
            component: 'useMarketStore',
            action: 'setCurrentSymbol'
          });
          
          // 少し遅延させてからポーリング開始（確実に前のポーリングが停止するのを待つ）
          setTimeout(() => {
            get().startPolling();
          }, 100);
        }, 200);
      },
      
      // 取引種別を設定
      setExchangeType: (type: ExchangeType) => {
        // シンボルストアを使用して取引種別を更新
        // これにより、取引種別管理が一元化される
        import('./useSymbolStore').then(symbolStoreModule => {
          symbolStoreModule.useSymbolStore.getState().setExchangeType(type);
        }).catch(error => {
          logger.error(`Failed to update exchange type in symbol store: ${error}`, {
            component: 'useMarketStore',
            action: 'setExchangeType',
            error
          });
        });
        
        // 自身のストア状態も更新
        set({ exchangeType: type });
        api.setExchangeType(type);
        
        // 取引種別変更後、データを再取得
        const state = get();
        state.fetchOrderBook();
      },
      
      // オーダーブック取得
      // 現在のリクエストをキャンセルするためのAbortController
      _abortController: null as AbortController | null,
      
      fetchOrderBook: async (symbolOverride?: string, signal?: AbortSignal) => {
        // シンボル正規化関数（一貫性のある正規化処理のため）
        const normalizeSymbol = (s: string) => s.replace('/', '');
        
        // symbolOverrideが指定されている場合はそれを使用、そうでなければcurrentSymbolを使用
        const { currentSymbol, exchangeType } = get();
        
        // シンボルストアから最新のシンボルも取得（同期ずれ検出用）
        let symbolStoreSymbol = currentSymbol; // デフォルト値
        let normalizedSymbolStoreSymbol = normalizeSymbol(symbolStoreSymbol);
        
        try {
          // 動的インポートを使用してシンボルストアから最新の値を取得
          const symbolStoreModule = await import('./useSymbolStore');
          symbolStoreSymbol = symbolStoreModule.useSymbolStore.getState().currentSymbol;
          normalizedSymbolStoreSymbol = normalizeSymbol(symbolStoreSymbol);
        } catch (error) {
          logger.warn(`Failed to get symbol from symbol store: ${error}`, {
            component: 'useMarketStore',
            action: 'fetchOrderBook',
            error
          });
        }
        
        // 使用するシンボルを決定
        let symbol = symbolOverride || currentSymbol;
        
        // シンボルを正規化
        const normalizedSymbol = normalizeSymbol(symbol);
        
        // シンボルストアとの同期ずれを検出
        if (!symbolOverride && normalizeSymbol(currentSymbol) !== normalizedSymbolStoreSymbol) {
          logger.warn(`Symbol mismatch detected between stores: market=${currentSymbol}, symbol=${symbolStoreSymbol}`, {
            component: 'useMarketStore',
            action: 'fetchOrderBook'
          });
          
          // シンボルストアのシンボルを優先
          symbol = symbolStoreSymbol;
          
          // マーケットストアのシンボルを強制的に更新（UIの即時反映のため）
          set({ currentSymbol: symbolStoreSymbol });
        }
        
        // 最終的に使用するシンボルを正規化
        const normalizedFinalSymbol = normalizeSymbol(symbol);
        
        logger.info(`Fetching order book with symbol: ${symbol} (normalized: ${normalizedFinalSymbol}, override: ${symbolOverride ? 'yes' : 'no'})`, {
          component: 'useMarketStore',
          action: 'fetchOrderBook',
          currentSymbol,
          symbolStoreSymbol,
          symbolOverride,
          normalizedFinalSymbol
        });
        
        // ローディング状態を設定
        set({ isLoadingOrderBook: true, orderBookError: null });
        
        try {
          // 共通サービスを使用してオーダーブックを取得
          const orderBook = await dataFetchService.fetchOrderBook(
            normalizedFinalSymbol, // 正規化した最新のシンボルを使用
            exchangeType,
            signal
          );
          
          // 重要: 現在のシンボルとリクエストされたシンボルが一致するか確認
          // これにより古いリクエストの結果が新しいシンボルを上書きするのを防止
          const currentState = get();
          const normalizedCurrentSymbol = currentState.currentSymbol.replace('/', '');
          
          if (normalizedCurrentSymbol !== normalizedFinalSymbol) {
            logger.info(`シンボルが変更されています。古いリクエスト結果を破棄: ${normalizedFinalSymbol} != ${normalizedCurrentSymbol}`, {
              component: 'useMarketStore',
              action: 'fetchOrderBook'
            });
            return; // データは返さず、状態も更新しない
          }
          
          // 取得したデータを状態に設定
          set({
            orderBook,
            isLoadingOrderBook: false,
            isDemoMode: false // 正常取得の場合はデモモードをオフ
          });
        } catch (error: any) {
          // AbortErrorの場合は静かに失敗（キャンセルされたリクエスト）
          if (error.name === 'AbortError') {
            logger.info(`オーダーブック取得がキャンセルされました: ${currentSymbol}`, {
              component: 'useMarketStore',
              action: 'fetchOrderBook'
            });
            return;
          }
          
          // その他のエラーハンドリング
          logger.error(`オーダーブック取得エラー: ${error.message}`, {
            component: 'useMarketStore',
            action: 'fetchOrderBook',
            symbol: currentSymbol,
            error
          });
          
          // デモデータを表示
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
      },
      
      // ポーリング間隔を設定
      setPollingInterval: (interval: number) => {
        set({ pollingInterval: interval });
      },
      
      // ポーリングを開始
      startPolling: () => {
        // シンボル正規化関数（一貫性のある正規化処理のため）
        const normalizeSymbol = (s: string) => s.replace('/', '');
        
        // 先に完全に停止してから再開始する
        // これにより重複ポーリングを確実に防止
        get().stopPolling();
        
        // ポーリングが確実に停止されるまで待つ
        setTimeout(() => {
          // 最新の状態を取得
          const currentState = get();
          
          // シンボルストアから最新のシンボルも取得（同期ずれ検出用）
          const symbolStoreSymbol = currentState.currentSymbol; // 現在の値を使用
          const normalizedSymbolStoreSymbol = normalizeSymbol(symbolStoreSymbol);
          
          // 現在のシンボルを取得して正規化
          const symbol = currentState.currentSymbol;
          const normalizedSymbol = normalizeSymbol(symbol);
          
          // 通常のポーリング開始
          logger.info(`Starting polling for ${normalizedSymbol} (original: ${symbol})`, {
            component: 'useMarketStore',
            action: 'startPolling'
          });
          
          // ポーリングフラグをオンにする
          set({ isPolling: true });
          
          // ポーリング関数を定義
          startPollingWithSymbol(symbol, normalizedSymbol);
        }, 300); // ポーリングが確実に停止されるまで十分な時間を待つ
        
        // 指定されたシンボルでポーリングを開始する内部関数
        function startPollingWithSymbol(symbol: string, normalizedSymbol: string) {
          // ポーリング関数
          const poll = async () => {
            // ポーリングが停止されているか確認
            const currentState = get();
            if (!currentState.isPolling) {
              logger.info('Polling stopped, exiting poll function', {
                component: 'useMarketStore',
                action: 'poll'
              });
              return;
            }
            
            // 現在のシンボルを取得して正規化
            const currentSymbol = currentState.currentSymbol;
            const currentNormalizedSymbol = normalizeSymbol(currentSymbol);
            
            // シンボルが変更されている場合はポーリングを停止
            if (normalizedSymbol !== currentNormalizedSymbol) {
              logger.info(`Symbol changed from ${normalizedSymbol} to ${currentNormalizedSymbol}, stopping poll`, {
                component: 'useMarketStore',
                action: 'poll'
              });
              set({ isPolling: false });
              return;
            }
            
            try {
              // 新しいAbortControllerを作成
              const abortController = new AbortController();
              
              // データ取得（明示的に正規化したシンボルを渡す）
              await currentState.fetchOrderBook(normalizedSymbol, abortController.signal);
              
              // 現在のポーリング状態を再確認
              const latestState = get();
              
              // ポーリングが停止されていないか、シンボルが変更されていない場合のみ継続
              if (latestState.isPolling && normalizeSymbol(latestState.currentSymbol) === normalizedSymbol) {
                // 次回のポーリングをスケジュール
                setTimeout(() => {
                  poll();
                }, latestState.pollingInterval);
              } else {
                logger.info(`Polling conditions changed, stopping poll for ${normalizedSymbol}`, {
                  component: 'useMarketStore',
                  action: 'poll'
                });
              }
            } catch (error) {
              logger.error(`Error during polling: ${error}`, {
                component: 'useMarketStore',
                action: 'poll',
                error
              });
              
              // 現在のポーリング状態を再確認
              const latestState = get();
              
              // ポーリングが停止されていないか、シンボルが変更されていない場合のみ継続
              if (latestState.isPolling && normalizeSymbol(latestState.currentSymbol) === normalizedSymbol) {
                // エラーが発生してもポーリングを継続
                setTimeout(() => {
                  poll();
                }, latestState.pollingInterval);
              } else {
                logger.info(`Polling conditions changed after error, stopping poll for ${normalizedSymbol}`, {
                  component: 'useMarketStore',
                  action: 'poll'
                });
              }
            }
          };
          
          // 初回ポーリングを開始
          poll();
        }
      },
      
      // ポーリングを停止
      stopPolling: () => {
        const { isPolling, currentSymbol } = get();
        
        if (isPolling) {
          logger.info(`Stopping polling for ${currentSymbol.replace('/', '')}`, {
            component: 'useMarketStore',
            action: 'stopPolling'
          });
          
          // ポーリングフラグをオフにする
          set({ isPolling: false });
          
          // ポーリングが確実に停止されたことを確認するログ
          setTimeout(() => {
            const { isPolling } = get();
            if (!isPolling) {
              logger.info('Polling successfully stopped', {
                component: 'useMarketStore',
                action: 'stopPolling'
              });
            }
          }, 100);
        } else {
          logger.info('Polling already stopped, no action needed', {
            component: 'useMarketStore',
            action: 'stopPolling'
          });
        }
      }
    }),
    { name: 'market-store' }
  )
);

// シンボルストアの変更を監視して自動的に更新する
// コンポーネントのマウント時に一度だけ実行される初期化コード
const initializeSymbolStoreSubscription = () => {
  // シンボル正規化関数（一貫性のある正規化処理のため）
  const normalizeSymbol = (s: string) => s.replace('/', '');
  
  // 初期化時に動的インポートを使用
  import('./useSymbolStore').then(symbolStoreModule => {
    // シンボルストアを購読
    const unsubscribe = symbolStoreModule.useSymbolStore.subscribe((symbolState: SymbolState, prevState: SymbolState) => {
      const marketStore = useMarketStore.getState();
      const currentSymbol = marketStore.currentSymbol;
      const newSymbol = symbolState.currentSymbol;
      const newExchangeType = symbolState.exchangeType;
      
      // 正規化したシンボルで比較
      const normalizedCurrentSymbol = normalizeSymbol(currentSymbol);
      const normalizedNewSymbol = normalizeSymbol(newSymbol);
      
      // シンボルが変更された場合のみ更新
      if (normalizedCurrentSymbol !== normalizedNewSymbol) {
        logger.info(`Symbol changed in SymbolStore from ${currentSymbol} to ${newSymbol} (normalized: ${normalizedCurrentSymbol} to ${normalizedNewSymbol})`, {
          component: 'useMarketStore',
          action: 'symbolStoreSubscription'
        });
        
        // 進行中のリクエストをキャンセル
        if (marketStore._abortController) {
          marketStore._abortController.abort();
        }
        
        // 新しいAbortControllerを作成
        const abortController = new AbortController();
        
        // UIを更新
        useMarketStore.setState({
          currentSymbol: newSymbol,
          orderBook: { asks: [], bids: [], symbol: newSymbol, timestamp: Date.now() },
          trades: [],
          orderBookError: null,
          isLoadingOrderBook: true,
          _abortController: abortController
        });
        
        // ポーリングを停止
        marketStore.stopPolling();
        
        // データを再取得（明示的に正規化したシンボルを渡す）
        marketStore.fetchOrderBook(normalizedNewSymbol, abortController.signal);
        
        // 少し遅延させてからポーリングを再開
        setTimeout(() => {
          // 最新の状態を取得
          const latestState = useMarketStore.getState();
          
          // シンボルが変更されていないことを確認
          if (normalizeSymbol(latestState.currentSymbol) === normalizedNewSymbol) {
            latestState.startPolling();
          }
        }, 300);
      }
      
      // 取引種別が変更された場合も更新
      if (marketStore.exchangeType !== newExchangeType) {
        logger.info(`Exchange type changed in SymbolStore to ${newExchangeType}, updating MarketStore`, {
          component: 'useMarketStore',
          action: 'symbolStoreSubscription'
        });
        
        // UIを更新
        useMarketStore.setState({ exchangeType: newExchangeType });
        
        // APIクライアントの取引種別も更新
        api.setExchangeType(newExchangeType);
        
        // データを再取得
        marketStore.fetchOrderBook();
      }
    });
    
    // 購読解除関数は返さない（アプリケーションのライフサイクル全体で有効）
  }).catch(error => {
    logger.error(`Failed to initialize symbol store subscription: ${error}`, {
      component: 'useMarketStore',
      action: 'initializeSymbolStoreSubscription',
      error
    });
  });
};

// 初期化を実行
initializeSymbolStoreSubscription();

// 初期化後にシンボルストアから最新の値を取得して更新
setTimeout(() => {
  import('./useSymbolStore').then(symbolStoreModule => {
    const symbolState = symbolStoreModule.useSymbolStore.getState();
    useMarketStore.setState({
      currentSymbol: symbolState.currentSymbol,
      exchangeType: symbolState.exchangeType
    });
  }).catch(error => {
    logger.error(`Failed to update initial state from symbol store: ${error}`, {
      component: 'useMarketStore',
      action: 'initializeState',
      error
    });
  });
}, 100);
