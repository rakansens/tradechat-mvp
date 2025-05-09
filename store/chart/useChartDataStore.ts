// store/chart/useChartDataStore.ts
// 更新: AppStoreを中心とした放射状の依存関係に変更
// 更新: 動的インポートを削除し、明確な依存関係を確立
// 更新: 循環参照を解消
// 更新: Zodバリデーションスキーマを適用
//
// このストアはチャートのデータ（OHLC）と、データの取得状態を管理します。
// リアルタイム更新用のメソッドも提供します。
// シンボル管理はuseAppStoreに委譲し、循環参照を解消しました。

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { BitgetApiClient } from '../../services/bitgetApi';
import dataFetchService from '../../services/dataFetchService';
import { OHLCData, Timeframe } from '../../types/chart';
import { generateOHLCData } from '../../utils/ohlcDummyData';
import { useChartConfigStore } from './useChartConfigStore';
import { useAppStore } from '../useAppStore';
import { useRealTimeStore } from './useRealTimeStore';
import { logger } from '../../utils/logger';
import { ChartDataState } from '../../types/store';
import {
  validateOHLCData,
  validateTimeframe,
  validateChartDataState
} from '../../lib/validations/chart';

// ローカルストレージから直接設定を取得
// リフレッシュ時にも設定が保持されるように
let initialTimeframe: Timeframe = "1d"; // デフォルト値

// ブラウザ環境の場合はローカルストレージから取得
if (typeof window !== 'undefined') {
  // 両方のキーを個別に取得して、どちらが最新かを確認
  const lastUsedTimeframeValue = localStorage.getItem('lastUsedTimeframe');
  const selectedTimeframeValue = localStorage.getItem('selectedTimeframe');
  
  // selectedTimeframeを優先する（これが最新の値）
  const storedTimeframe = selectedTimeframeValue || lastUsedTimeframeValue;
  
  if (storedTimeframe && ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'].includes(storedTimeframe)) {
    initialTimeframe = storedTimeframe as Timeframe;
  }
}

// AppStoreの状態も確認
const appState = useAppStore.getState();
// AppStoreの値がある場合は、それを使用（ただし、ローカルストレージの値を優先）
if (!initialTimeframe && appState.currentTimeFrame) {
  initialTimeframe = appState.currentTimeFrame;
}

const initialOhlcData: OHLCData[] = generateOHLCData(
  100,
  initialTimeframe
);

// 初期化時に現在の時間足設定をログ出力
logger.info(`チャートデータストアの初期化、時間足: ${initialTimeframe}`, {
  component: 'useChartDataStore',
  action: 'initialize',
  source: 'localStorage',
  appStateCurrentTimeFrame: appState.currentTimeFrame,
  appStateInitialized: !!appState.currentTimeFrame,
  localStorage_lastUsedTimeframe: typeof window !== 'undefined' ? localStorage.getItem('lastUsedTimeframe') : null,
  localStorage_selectedTimeframe: typeof window !== 'undefined' ? localStorage.getItem('selectedTimeframe') : null
});

// チャートデータストアの作成
export const useChartDataStore = create<ChartDataState>()(
  devtools(
    (set, get) => ({
      // 状態
      data: initialOhlcData,
      isLoading: false,
      error: null,
      currentSymbol: useAppStore.getState().currentSymbol,
      currentTimeFrame: initialTimeframe,
      
      // アクション
      // 現在のリクエストをキャンセルするためのAbortController
      _abortController: null as AbortController | null,
      
      fetchData: async (symbol: string, timeFrame: Timeframe, signal?: AbortSignal, useCache: boolean = true) => {
        // 開発環境でのバリデーション
        if (process.env.NODE_ENV !== 'production') {
          const timeframeResult = validateTimeframe(timeFrame);
          if (!timeframeResult.success) {
            logger.warn(`Invalid timeframe: ${timeFrame}`, {
              component: 'useChartDataStore',
              action: 'fetchData',
              error: timeframeResult.error
            });
          }
        }
        set({ isLoading: true, error: null });
        
        // 最新の状態を取得（リフレッシュボタンが押された場合など、状態が変わっている可能性がある）
        const currentState = get();
        const latestTimeFrame = currentState.currentTimeFrame;
        
        // AppStoreから最新のシンボルを取得
        const appState = useAppStore.getState();
        const latestSymbol = appState.currentSymbol;
        
        // 明示的に渡されたシンボルとタイムフレームを使用するか、最新の状態を使用する
        const finalSymbol = symbol || latestSymbol;
        const finalTimeFrame = timeFrame || latestTimeFrame;
        
        try {
          // AppStoreから現在の取引タイプを取得
          const { exchangeType } = appState;
          
          if (process.env.NODE_ENV !== 'production') {
            console.log('[fetchData] exchangeType:', exchangeType, 'symbol:', finalSymbol, 'timeframe:', finalTimeFrame);
            console.log('[fetchData] original symbol:', symbol, 'latest symbol:', latestSymbol);
          }
          
          // データ取得前のデータ内容を記録
          logger.debug(`データ取得前のデータ内容:`, {
            component: 'useChartDataStore',
            action: 'fetchData',
            symbol: finalSymbol,
            timeFrame: finalTimeFrame,
            dataCount: get().data.length,
            dataSample: get().data.slice(-3) // 最後の3件のデータをサンプルとして記録
          });
          
          // 共通サービスを使用してチャートデータを取得
          const data = await dataFetchService.fetchChartData(
            finalSymbol,
            finalTimeFrame,
            exchangeType,
            signal,
            useCache
          );
          
          // 取得したデータの内容を記録
          logger.debug(`取得したデータの内容:`, {
            component: 'useChartDataStore',
            action: 'fetchData',
            symbol: finalSymbol,
            timeFrame: finalTimeFrame,
            dataCount: data.length,
            dataSample: data.slice(-3) // 最後の3件のデータをサンプルとして記録
          });
          
          // 重要: 現在のシンボルとリクエストされたシンボルが一致するか確認
          // これにより古いリクエストの結果が新しいシンボルを上書きするのを防止
          const latestState = get();
          if (latestState.currentSymbol !== finalSymbol) {
            logger.info(`シンボルが変更されています。古いリクエスト結果を破棄: ${finalSymbol} != ${latestState.currentSymbol}`, {
              component: 'useChartDataStore',
              action: 'fetchData'
            });
            return data; // データは返すが状態は更新しない
          }
          
          // 状態を更新
          set({
            data,
            isLoading: false,
            currentSymbol: finalSymbol,
            currentTimeFrame: finalTimeFrame
          });
          
          // 状態更新後のデータ内容を記録
          logger.debug(`状態更新後のデータ内容:`, {
            component: 'useChartDataStore',
            action: 'fetchData',
            symbol: finalSymbol,
            timeFrame: finalTimeFrame,
            dataCount: get().data.length,
            dataSample: get().data.slice(-3) // 最後の3件のデータをサンプルとして記録
          });
          
          return data;
        } catch (error: any) {
          // エラーハンドリング
          let errorMessage = 'チャートデータの取得に失敗しました';
          
          if (error.name === 'AbortError') {
            // AbortControllerによるキャンセルの場合は静かに失敗
            logger.info(`チャートデータ取得がキャンセルされました: ${symbol}`, {
              component: 'useChartDataStore',
              action: 'fetchData'
            });
            return;
          }
          
          if (error.response) {
            errorMessage = `API エラー: ${error.response.status} ${error.response.statusText}`;
          } else if (error.request) {
            errorMessage = 'サーバーからの応答がありません';
          } else {
            errorMessage = `エラー: ${error.message}`;
          }
          
          // 先物取引でサポートされていない銘柄のエラーの場合は、よりユーザーフレンドリーなメッセージに変換
          const { exchangeType } = useChartConfigStore.getState();
          if (
            errorMessage.includes('先物取引でサポートされていません') ||
            (
              exchangeType === 'futures' &&
              (errorMessage.includes('status code 400') || errorMessage.includes('Bad Request'))
            )
          ) {
            errorMessage = `この銘柄は先物取引で利用できません。現物取引をお試しください。`;
          }
          
          logger.error(errorMessage, {
            component: 'useChartDataStore',
            action: 'fetchData',
            error
          });
          
          // 将来的な拡張: エラー時に取引種別を変更するロジック
          // 例: useChartConfigStore.getState().setExchangeType('spot');
          
          // APIが失敗した場合はダミーデータを使用
          const dummyData = generateOHLCData(100, timeFrame);
          set({
            data: dummyData,
            isLoading: false,
            error: errorMessage,
            currentSymbol: finalSymbol,         // エラー時でも現在のシンボルを保持
            currentTimeFrame: finalTimeFrame    // エラー時でも現在のタイムフレームを保持
          });
          
          return dummyData;
        }
      },
      
      // データを更新
      updateData: (data: OHLCData) => {
        // 開発環境でのバリデーション
        if (process.env.NODE_ENV !== 'production') {
          const dataResult = validateOHLCData(data);
          if (!dataResult.success) {
            logger.warn('Invalid OHLC data', {
              component: 'useChartDataStore',
              action: 'updateData',
              error: dataResult.error
            });
          }
        }
        set((state) => ({
          data: [...state.data, data]
        }));
      },
      
      // タイムフレームを更新
      updateTimeFrame: async (timeFrame: Timeframe) => {
        // 開発環境でのバリデーション
        if (process.env.NODE_ENV !== 'production') {
          const timeframeResult = validateTimeframe(timeFrame);
          if (!timeframeResult.success) {
            logger.warn(`Invalid timeframe: ${timeFrame}`, {
              component: 'useChartDataStore',
              action: 'updateTimeFrame',
              error: timeframeResult.error
            });
          }
        }
        // 現在のタイムフレームと同じ場合は何もしない
        const currentTimeFrame = get().currentTimeFrame;
        if (timeFrame === currentTimeFrame) {
          logger.info(`Timeframe already set to ${timeFrame}, skipping update`, {
            component: 'useChartDataStore',
            action: 'updateTimeFrame'
          });
          return;
        }
        
        // ログ出力
        logger.info(`Changing timeframe from ${currentTimeFrame} to ${timeFrame}`, {
          component: 'useChartDataStore',
          action: 'updateTimeFrame'
        });
        
        // 重要: AppStoreにも時間足の変更を反映する
        // これによりリフレッシュ後も設定が保持される
        try {
          const appStore = useAppStore.getState();
          if (typeof appStore.updateTimeFrame === 'function') {
            // AppStoreのupdateTimeFrameメソッドを使用して更新
            appStore.updateTimeFrame(timeFrame);
            logger.info(`Updated timeframe in AppStore to ${timeFrame}`, {
              component: 'useChartDataStore',
              action: 'updateTimeFrame'
            });
          } else {
            // AppStoreのメソッドが見つからない場合は直接保存
            try {
              localStorage.setItem('lastUsedTimeframe', timeFrame);
              localStorage.setItem('selectedTimeframe', timeFrame); // 互換性のため
              logger.info(`Directly saved timeframe to localStorage: ${timeFrame}`, {
                component: 'useChartDataStore',
                action: 'updateTimeFrame'
              });
            } catch (e) {
              logger.warn('Failed to save timeframe to localStorage', {
                component: 'useChartDataStore',
                action: 'updateTimeFrame',
                error: e
              });
            }
          }
          
          // 重要: データフェッチサービスのキャッシュをクリア
          // これにより時間足変更時に古いキャッシュが使われないようにする
          try {
            const { currentSymbol } = get();
            const { exchangeType } = appStore;
            
            logger.info(`タイムフレーム変更前のキャッシュクリア準備`, {
              component: 'useChartDataStore',
              action: 'updateTimeFrame',
              currentSymbol,
              timeFrame,
              exchangeType,
              localStorage_lastUsedTimeframe: typeof window !== 'undefined' ? localStorage.getItem('lastUsedTimeframe') : null,
              localStorage_selectedTimeframe: typeof window !== 'undefined' ? localStorage.getItem('selectedTimeframe') : null
            });
            
            import('../../services/dataFetchService').then(module => {
              const dataFetchService = module.default;
              if (typeof dataFetchService.handleTimeframeChange === 'function') {
                dataFetchService.handleTimeframeChange(currentSymbol, timeFrame, exchangeType);
                logger.info(`Cleared chart cache for timeframe change to ${timeFrame}`, {
                  component: 'useChartDataStore',
                  action: 'updateTimeFrame',
                  symbol: currentSymbol,
                  exchangeType
                });
              }
            });
          } catch (e) {
            logger.warn('Failed to clear cache for timeframe change', {
              component: 'useChartDataStore',
              action: 'updateTimeFrame',
              error: e
            });
          }
        } catch (e) {
          logger.warn('Failed to update AppStore with new timeframe', {
            component: 'useChartDataStore',
            action: 'updateTimeFrame',
            error: e
          });
        }
        
        // 先にタイムフレームを更新してUIに即反映
        set({ 
          currentTimeFrame: timeFrame,
          isLoading: true,
          error: null
        });
        
        // 少し遅延させてから新しいデータを取得
        // これにより、UIの更新が先に行われる
        setTimeout(async () => {
          try {
            // 最新のシンボルとタイムフレームを取得（非同期処理中に変更された可能性がある）
            const { currentSymbol, currentTimeFrame } = get();
            
            // データ取得前のデータ内容を記録
            logger.debug(`タイムフレーム変更前のデータ内容:`, {
              component: 'useChartDataStore',
              action: 'updateTimeFrame',
              currentTimeFrame,
              newTimeFrame: timeFrame,
              dataCount: get().data.length,
              dataSample: get().data.slice(-5) // 最後の5件のデータをサンプルとして記録
            });
            
            // タイムフレームが変更されていないことを確認
            if (timeFrame === currentTimeFrame) {
              // 最初にキャッシュをしっかりクリアする
              logger.info(`タイムフレーム変更に伴いキャッシュをクリアします: ${currentSymbol} ${timeFrame}`, {
                component: 'useChartDataStore',
                action: 'updateTimeFrame'
              });
              
              // シンボル、タイムフレーム、取引種別を指定してキャッシュをクリア
              const appState = useAppStore.getState();
              dataFetchService.handleTimeframeChange(currentSymbol, timeFrame, appState.exchangeType);
              
              // キャッシュを使用せずに新しいデータを取得
              logger.info(`新しい時間足データを取得します: ${currentSymbol} ${timeFrame}`, {
                component: 'useChartDataStore',
                action: 'updateTimeFrame'
              });
              await get().fetchData(currentSymbol, timeFrame, undefined, false);
              
              // データ取得後のデータ内容を記録
              logger.debug(`タイムフレーム変更後のデータ内容:`, {
                component: 'useChartDataStore',
                action: 'updateTimeFrame',
                currentTimeFrame: get().currentTimeFrame,
                dataCount: get().data.length,
                dataSample: get().data.slice(-5) // 最後の5件のデータをサンプルとして記録
              });
              
              // リアルタイム更新を再開
              try {
                const { startRealTimeUpdates, useRealTimeData } = useRealTimeStore.getState();
                if (useRealTimeData) {
                  startRealTimeUpdates();
                }
              } catch (e) {
                logger.warn('Failed to update real-time updates', {
                  component: 'useChartDataStore',
                  action: 'updateTimeFrame',
                  error: e
                });
              }
            } else {
              logger.info(`Timeframe changed during async operation from ${timeFrame} to ${currentTimeFrame}, skipping fetch`, {
                component: 'useChartDataStore',
                action: 'updateTimeFrame'
              });
            }
          } catch (e) {
            logger.error('Failed to fetch data after timeframe update', {
              component: 'useChartDataStore',
              action: 'updateTimeFrame',
              error: e
            });
          }
        }, 50); // 状態更新後に実行するために少し遅延させる
      },
      
      // シンボルを更新
      updateSymbol: async (symbol: string) => {
        // 開発環境でのバリデーション
        if (process.env.NODE_ENV !== 'production' && (!symbol || typeof symbol !== 'string')) {
          logger.warn(`Invalid symbol: ${symbol}`, {
            component: 'useChartDataStore',
            action: 'updateSymbol'
          });
        }
        // 自身のストア状態も更新（UIの即時反映のため）
        const abortController = new AbortController();
        set({
          currentSymbol: symbol,
          isLoading: true,
          error: null,
          _abortController: abortController
        });
        
        // データ取得
        try {
          // 最新のタイムフレームを取得
          const { currentTimeFrame } = get();
          
          // 新しいデータを取得（AbortControllerのsignalを渡す）
          await get().fetchData(symbol, currentTimeFrame, abortController.signal, true);
          
          // AppStoreのポーリング機能を使用
          try {
            // ポーリングはAppStoreで一元管理されるため、ここでは何もしない
            logger.info('Chart data polling is now managed by AppStore', {
              component: 'useChartDataStore',
              action: 'updateSymbol'
            });
            
            // リアルタイム更新を再開（既存の機能を維持）
            const { startRealTimeUpdates, useRealTimeData } = useRealTimeStore.getState();
            if (useRealTimeData) {
              startRealTimeUpdates();
            }
          } catch (e) {
            logger.warn('Failed to start polling via AppStore', {
              component: 'useChartDataStore',
              action: 'updateSymbol',
              error: e
            });
          }
        } catch (e: any) {
          // AbortErrorは通常のエラーとして扱わない
          if (e.name !== 'AbortError') {
            logger.error('Failed to fetch data after symbol update', {
              component: 'useChartDataStore',
              action: 'updateSymbol',
              error: e
            });
          } else {
            logger.info('Request was aborted due to symbol change', {
              component: 'useChartDataStore',
              action: 'updateSymbol'
            });
          }
        }
      },
      
      // 最新のローソク足を更新（リアルタイムデータ用）
      updateLastCandle: (newCandle: OHLCData) => {
        // 開発環境でのバリデーション
        if (process.env.NODE_ENV !== 'production') {
          const dataResult = validateOHLCData(newCandle);
          if (!dataResult.success) {
            logger.warn('Invalid OHLC data for last candle', {
              component: 'useChartDataStore',
              action: 'updateLastCandle',
              error: dataResult.error
            });
          }
        }
        set((state) => {
          // 既存のデータ配列を取得
          const data = [...state.data];
          
          // 最後のローソク足を取得
          const lastCandle = data[data.length - 1];
          
          // 同じ時間のローソク足なら更新、そうでなければ追加
          if (lastCandle && lastCandle.time === newCandle.time) {
            // 最後のローソク足を更新
            data[data.length - 1] = newCandle;
          } else {
            // 新しいローソク足を追加
            data.push(newCandle);
            
            // データが多すぎる場合は古いものを削除
            if (data.length > 500) {
              data.shift();
            }
          }
          
          return { data };
        });
      }
    }),
    { name: "chart-data-store" }
  )
);

// AppStoreの変更を監視して自動的に更新する
// コンポーネントのマウント時に一度だけ実行される初期化コード
const initializeAppStoreSubscription = () => {
  try {
    // AppStoreを購読
    const unsubscribe = useAppStore.subscribe((appState) => {
      const chartDataStore = useChartDataStore.getState();
      const currentSymbolInChartStore = chartDataStore.currentSymbol;
      const newSymbolFromAppStore = appState.currentSymbol;
      
      // シンボルが変更された場合のみ更新
      if (currentSymbolInChartStore !== newSymbolFromAppStore) {
        logger.info(`Symbol changed in AppStore to ${newSymbolFromAppStore}, triggering update in ChartDataStore`, {
          component: 'useChartDataStore',
          action: 'appStoreSubscription'
        });
        
        // UIを更新し、データ取得をトリガーするために `updateSymbol` を呼び出す
        chartDataStore.updateSymbol(newSymbolFromAppStore);
      }
    });
    
    // 購読解除関数は返さない（アプリケーションのライフサイクル全体で有効）
    logger.info(`Successfully initialized AppStore subscription`, {
      component: 'useChartDataStore',
      action: 'initializeAppStoreSubscription'
    });
  } catch (error) {
    logger.error(`Failed to initialize AppStore subscription: ${error}`, {
      component: 'useChartDataStore',
      action: 'initializeAppStoreSubscription',
      error
    });
  }
};

// 初期化を実行
initializeAppStoreSubscription();
