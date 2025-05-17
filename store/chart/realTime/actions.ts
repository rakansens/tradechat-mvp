// store/chart/realTime/actions.ts
// 作成: RealTimeSliceのアクション定義
// 更新: 2025-10-06 - 型定義をtypes.tsに移動し、immerSetを使用するように更新

import type { OHLCData } from "@/types/chart"
import type { ExchangeType } from "@/types/constants/enums"
import { BitgetApiClient } from "@/services/api/bitget/client"
import { type RealTimeSliceActions, type RealTimeSlice, type RealTimeSliceState } from "./types"
import { logger } from '@/utils/common'
import { useRootStore } from "@/store/rootStore"

// デバウンス関数の実装
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
      timeout = null
    }, wait)
  }
}

/**
 * リアルタイム更新スライスのアクションを作成する関数
 */
export const createRealTimeActions = (
  set: (fn: (state: RealTimeSliceState) => void) => void,
  get: () => RealTimeSlice
): RealTimeSliceActions => {
  // リアルタイム更新の実装（デバウンスされたバージョン）
  const startRealTimeUpdatesImpl = () => {
    try {
      // 現在のタイマーをクリア
      const timer = get().timer;
      if (timer) {
        clearInterval(timer);
      }
      
      // rootStoreから現在のシンボルとタイムフレームを取得
      const rootStore = useRootStore.getState();
      const currentSymbol = rootStore.currentSymbol;
      const currentTimeFrame = rootStore.currentTimeFrame;
      
      if (!currentSymbol) {
        logger.warn('シンボルが設定されていません', {
          component: 'RealTimeSlice',
          action: 'startRealTimeUpdates'
        });
        return;
      }
      
      // リアルタイム更新用のタイマーを設定
      const newTimer = setInterval(() => {
        // 最新のデータをフェッチ
        rootStore.fetchData(currentSymbol, currentTimeFrame, undefined, false)
          .then((data: OHLCData[] | undefined) => {
            // イベントハンドラを実行
            const handlers = get().eventHandlers['dataUpdate'] || [];
            handlers.forEach(handler => handler(data));
          })
          .catch((error: any) => {
            logger.error('リアルタイムデータ取得中にエラーが発生しました', {
              component: 'RealTimeSlice',
              action: 'timerUpdate',
              error
            });
          });
      }, 10000); // 10秒ごとに更新
      
      // タイマーを保存
      set(state => { 
        state.timer = newTimer;
        state.connected = true;
      });
      
      logger.info('リアルタイム更新を開始しました', {
        component: 'RealTimeSlice',
        action: 'startRealTimeUpdates',
        symbol: currentSymbol,
        timeframe: currentTimeFrame
      });
    } catch (error) {
      logger.error('リアルタイム更新の開始中にエラーが発生しました', {
        component: 'RealTimeSlice',
        action: 'startRealTimeUpdates',
        error
      });
    }
  };
  
  const debouncedStartRealTimeUpdates = debounce(startRealTimeUpdatesImpl, 500);
  
  return {
    startRealTimeUpdates: () => {
      if (!get().useRealTimeData) {
        logger.info('リアルタイムデータが無効になっています', {
          component: 'RealTimeSlice',
          action: 'startRealTimeUpdates'
        });
        return;
      }
      
      debouncedStartRealTimeUpdates();
    },
    
    stopRealTimeUpdates: () => {
      try {
        // タイマーを停止
        const timer = get().timer;
        if (timer) {
          clearInterval(timer);
          set(state => { 
            state.timer = null;
            state.connected = false;
          });
          
          logger.info('リアルタイム更新を停止しました', {
            component: 'RealTimeSlice',
            action: 'stopRealTimeUpdates'
          });
        }
      } catch (error) {
        logger.error('リアルタイム更新停止中にエラーが発生しました:', {
          component: 'RealTimeSlice',
          action: 'stopRealTimeUpdates',
          error
        });
      }
    },
    
    toggleRealTimeData: () => {
      const newValue = !get().useRealTimeData;
      set(state => { 
        state.useRealTimeData = newValue;
      });
      
      if (newValue) {
        // リアルタイムデータを有効にした場合は更新を開始
        get().startRealTimeUpdates();
      } else {
        // リアルタイムデータを無効にした場合は更新を停止
        get().stopRealTimeUpdates();
      }
    },
    
    initializeApi: (exchangeType: ExchangeType) => {
      try {
        set(state => {
          state.bitgetApi = new BitgetApiClient({}, exchangeType);
        });

        // リアルタイムデータが有効な場合は更新を開始
        if (get().useRealTimeData) {
          get().startRealTimeUpdates();
        }

        logger.info('Bitget APIクライアントを初期化しました', {
          component: 'RealTimeSlice',
          action: 'initializeApi',
          exchangeType
        });
      } catch (error) {
        logger.error('Bitget APIクライアント初期化エラー:', {
          component: 'RealTimeSlice',
          action: 'initializeApi',
          error
        });
      }
    }
  };
};
