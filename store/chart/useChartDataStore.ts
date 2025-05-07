// store/chart/useChartDataStore.ts
// 更新: シンボルストアへの依存関係を追加、循環参照を解消
// 更新: `updateSymbol`から循環呼び出しと内部購読を削除。
// 更新: `initializeSymbolStoreSubscription`が`updateSymbol`を呼び出してデータ取得をトリガーするように修正。
//
// このストアはチャートのデータ（OHLC）と、データの取得状態を管理します。
// リアルタイム更新用のメソッドも提供します。
// シンボル管理はuseSymbolStoreに委譲し、循環参照を解消しました。

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { BitgetApiClient } from '../../services/bitgetApi';
import { dataFetchService } from '../../services/dataFetchService';
import { OHLCData, Timeframe } from '../../types/chart';
import { generateOHLCData } from '../../utils/ohlcDummyData';
import { useChartConfigStore } from './useChartConfigStore';
import { useSymbolStore } from '../useSymbolStore';
import { logger } from '../../utils/logger';
import { ChartDataState } from '../../types/store';

// 初期値の設定
const initialTimeframe: Timeframe = "1d";
const initialOhlcData: OHLCData[] = generateOHLCData(
  100,
  initialTimeframe
);

// チャートデータストアの作成
export const useChartDataStore = create<ChartDataState>()(
  devtools(
    (set, get) => ({
      // 状態
      data: initialOhlcData,
      isLoading: false,
      error: null,
      currentSymbol: useSymbolStore.getState().currentSymbol,
      currentTimeFrame: initialTimeframe,
      
      // アクション
      // 現在のリクエストをキャンセルするためのAbortController
      _abortController: null as AbortController | null,
      
      fetchData: async (symbol: string, timeFrame: Timeframe, signal?: AbortSignal) => {
        set({ isLoading: true, error: null });
        
        // 最新の状態を取得（リフレッシュボタンが押された場合など、状態が変わっている可能性がある）
        const currentState = get();
        const latestTimeFrame = currentState.currentTimeFrame;
        
        // シンボルストアから最新のシンボルを取得
        const symbolState = useSymbolStore.getState();
        const latestSymbol = symbolState.currentSymbol;
        
        // 明示的に渡されたシンボルとタイムフレームを使用するか、最新の状態を使用する
        const finalSymbol = symbol || latestSymbol;
        const finalTimeFrame = timeFrame || latestTimeFrame;
        
        try {
          // シンボルストアから現在の取引タイプを取得
          const { exchangeType } = symbolState;
          
          if (process.env.NODE_ENV !== 'production') {
            console.log('[fetchData] exchangeType:', exchangeType, 'symbol:', finalSymbol, 'timeframe:', finalTimeFrame);
            console.log('[fetchData] original symbol:', symbol, 'latest symbol:', latestSymbol);
          }
          
          // 共通サービスを使用してチャートデータを取得
          const data = await dataFetchService.fetchChartData(
            finalSymbol,
            finalTimeFrame,
            exchangeType,
            signal
          );
          
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
        set((state) => ({
          data: [...state.data, data]
        }));
      },
      
      // タイムフレームを更新
      updateTimeFrame: async (timeFrame: Timeframe) => {
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
            
            // タイムフレームが変更されていないことを確認
            if (timeFrame === currentTimeFrame) {
              // 新しいデータを取得
              await get().fetchData(currentSymbol, timeFrame);
              
              // リアルタイム更新を再開
              try {
                const { startRealTimeUpdates, useRealTimeData } = (await import('./useRealTimeStore')).useRealTimeStore.getState();
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
          await get().fetchData(symbol, currentTimeFrame, abortController.signal);
          
          // リアルタイム更新を再開
          try {
            const { startRealTimeUpdates, useRealTimeData } = (await import('./useRealTimeStore')).useRealTimeStore.getState();
            if (useRealTimeData) {
              startRealTimeUpdates();
            }
          } catch (e) {
            logger.warn('Failed to update real-time updates', {
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

// シンボルストアの変更を監視して自動的に更新する
// コンポーネントのマウント時に一度だけ実行される初期化コード
const initializeSymbolStoreSubscription = () => {
  // シンボルストアを購読
  const unsubscribe = useSymbolStore.subscribe((symbolState, prevState) => {
    const chartDataStore = useChartDataStore.getState();
    const currentSymbolInChartStore = chartDataStore.currentSymbol;
    const newSymbolFromSymbolStore = symbolState.currentSymbol;
    
    // シンボルが変更された場合のみ更新
    if (currentSymbolInChartStore !== newSymbolFromSymbolStore) {
      logger.info(`Symbol changed in SymbolStore to ${newSymbolFromSymbolStore}, triggering update in ChartDataStore`, {
        component: 'useChartDataStore',
        action: 'symbolStoreSubscription'
      });
      
      // UIを更新し、データ取得をトリガーするために `updateSymbol` を呼び出す
      chartDataStore.updateSymbol(newSymbolFromSymbolStore);
    }
  });
  
  // 購読解除関数は返さない（アプリケーションのライフサイクル全体で有効）
  // TODO: アプリケーション終了時やストアが不要になった場合に購読解除する仕組みを検討
};

// 初期化を実行
initializeSymbolStoreSubscription();
