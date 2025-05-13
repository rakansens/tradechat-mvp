// store/socket/actions.ts
// 作成: 2025-05-10 - ソケット接続状態を管理するスライスのAction定義
// 更新: 2025-05-10 - StateCreator型の修正

import { StateCreator } from 'zustand';
import { SocketSliceState } from './state';
import { logger } from '@/utils/logger';
import { type StoreApi } from 'zustand';

export interface SocketSliceActions {
  /**
   * ソケット接続状態を更新する
   * @param connected 接続状態 (true: 接続済み, false: 切断)
   * @param source イベントのソース（ログ用）
   */
  setConnected: (connected: boolean, source?: string) => void;
  
  /**
   * Socket ID を更新する
   * @param socketId 設定するSocket ID
   * @param source イベントのソース（ログ用）
   */
  setSocketId: (socketId: string, source?: string) => void;
  
  // 購読状態を更新
  setSubscription: (type: 'orderbook' | 'chart', on: boolean, fn?: () => void) => void;
  
  // 全ての購読を解除
  unsubscribeAll: () => void;
  
  // WebSocketの接続状態を取得
  getWebSocketStatus: () => {
    connected: boolean;
    subscriptions: Record<'orderbook' | 'chart', boolean>;
  };
}

export type SocketSlice = SocketSliceState & SocketSliceActions;

export const createSocketSliceActions: StateCreator<
  SocketSlice,
  [],
  [],
  SocketSliceActions
> = (set, get, _store) => ({
  setConnected: (connected: boolean, source: string = 'socket-event') => {
    logger.info(`SocketSlice: 接続状態を${connected}に更新します`, {
      component: 'SocketSlice',
      action: 'setConnected',
      connected,
      source
    });
    try {
      set({ connected });
      logger.info(`SocketSlice: 接続状態を${connected}に更新しました`, {
        component: 'SocketSlice',
        action: 'setConnected',
        success: true,
        connected
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`SocketSlice: 接続状態更新エラー: ${errorMessage}`, {
        component: 'SocketSlice',
        action: 'setConnected',
        errorMessage,
        connected
      });
    }
  },
  
  setSocketId: (socketId: string, source: string = 'socket-event') => {
    logger.info(`SocketSlice: Socket ID ${socketId} を受信しました`, {
      component: 'SocketSlice',
      action: 'setSocketId',
      socketId,
      source
    });
    try {
      set({ socketId });
      logger.info(`SocketSlice: Socket ID ${socketId} を設定しました`, {
        component: 'SocketSlice',
        action: 'setSocketId',
        success: true,
        socketId
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`SocketSlice: Socket ID処理エラー: ${errorMessage}`, {
        component: 'SocketSlice',
        action: 'setSocketId',
        errorMessage,
        socketId
      });
    }
  },
  
  /**
   * 購読状態を更新
   */
  setSubscription: (type: 'orderbook' | 'chart', on: boolean, fn?: () => void) => {
    // 購読状態を更新
    set(state => ({
      subscriptions: {
        ...state.subscriptions,
        [type]: on
      }
    }));
    
    // 購読解除関数を保存または削除
    if (on && fn) {
      set(state => ({
        _unsubscribeFns: {
          ...state._unsubscribeFns,
          [type]: fn
        }
      }));
      
      logger.info(`${type}の購読を開始しました`, {
        component: 'SocketSlice',
        action: 'setSubscription',
        type,
        subscribed: on
      });
    } else if (!on) {
      // 購読解除関数を実行
      const { _unsubscribeFns } = get();
      const unsubscribe = _unsubscribeFns[type];
      
      if (unsubscribe && typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          logger.error(`購読解除中にエラーが発生しました: ${error}`, {
            component: 'SocketSlice',
            action: 'setSubscription',
            type,
            error
          });
        }
      }
      
      // 購読解除関数を削除
      set(state => {
        const newUnsubscribeFns = { ...state._unsubscribeFns };
        delete newUnsubscribeFns[type];
        
        return {
          _unsubscribeFns: newUnsubscribeFns
        };
      });
      
      logger.info(`${type}の購読を解除しました`, {
        component: 'SocketSlice',
        action: 'setSubscription',
        type,
        subscribed: on
      });
    }
  },
  
  /**
   * WebSocketの全ての購読を解除
   */
  unsubscribeAll: () => {
    const { _unsubscribeFns } = get();
    
    // _unsubscribeFnsが存在する場合のみ処理を実行
    if (_unsubscribeFns && typeof _unsubscribeFns === 'object') {
      // すべての購読解除関数を実行
      Object.values(_unsubscribeFns).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      
      // 購読解除関数をクリア
      set({
        _unsubscribeFns: {},
        subscriptions: {
          orderbook: false,
          chart: false
        }
      });
      
      logger.info('すべてのWebSocket購読を解除しました', {
        component: 'SocketSlice',
        action: 'unsubscribeAll'
      });
    } else {
      // _unsubscribeFnsが存在しない場合は初期化だけ行う
      logger.warn('WebSocket購読関数が存在しません', {
        component: 'SocketSlice',
        action: 'unsubscribeAll',
        unsubscribeFns: _unsubscribeFns
      });
      
      set({
        _unsubscribeFns: {},
        subscriptions: {
          orderbook: false,
          chart: false
        }
      });
    }
  },
  
  /**
   * WebSocketの接続状態を取得
   */
  getWebSocketStatus: () => {
    const { connected, subscriptions } = get();
    return { connected, subscriptions };
  }
}); 