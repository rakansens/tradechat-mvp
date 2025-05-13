// store/useWebSocketStore.ts
// 更新: useAppStoreから分離したWebSocket関連の状態と操作を管理するストア
// 更新: 循環参照を解消するために、socketServiceの動的インポートを使用
// 更新: getSocketService()を使用して初期化問題を解決
// 更新: 2025-05-12 - isConnectedメソッドの存在チェックを追加し、エラー処理を改善
//
// このストアはWebSocketの接続状態と購読を管理します。
// 主な機能:
// 1. WebSocket接続状態の管理
// 2. WebSocket購読の管理
// 3. 購読解除機能の提供

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { logger } from '../utils/logger';
import { useSymbolStore } from './useSymbolStore';
import { getSocketService } from '../services/socket/index';

// WebSocketストアの状態型定義
export interface WebSocketState {
  // WebSocket関連の状態
  wsConnected: boolean;
  wsSubscriptions: {
    orderbook: boolean;
    chart: boolean;
  };
  
  // 内部状態
  _wsUnsubscribeFunctions: Record<string, () => void>;
  
  // WebSocket関連のアクション
  unsubscribeAllWebSockets: () => void;
  getWebSocketStatus: () => { connected: boolean; subscriptions: { orderbook: boolean; chart: boolean } };
  
  // 接続状態の更新
  setConnected: (connected: boolean) => void;
  
  // 購読状態の更新
  setSubscription: (type: 'orderbook' | 'chart', subscribed: boolean, unsubscribeFunction?: () => void) => void;
}

// Zustandストア作成
export const useWebSocketStore = create<WebSocketState>()(
  devtools(
    (set, get) => ({
      // 初期状態 - WebSocket関連
      wsConnected: false,
      wsSubscriptions: {
        orderbook: false,
        chart: false
      },
      
      // 内部状態
      _wsUnsubscribeFunctions: {},
      
      /**
       * WebSocketの購読を解除
       */
      unsubscribeAllWebSockets: () => {
        const { _wsUnsubscribeFunctions } = get();
        
        // _wsUnsubscribeFunctionsが存在する場合のみ処理を実行
        if (_wsUnsubscribeFunctions && typeof _wsUnsubscribeFunctions === 'object') {
          // すべての購読解除関数を実行
          Object.values(_wsUnsubscribeFunctions).forEach(unsubscribe => {
            if (typeof unsubscribe === 'function') {
              unsubscribe();
            }
          });
          
          // 購読解除関数をクリア
          set({
            _wsUnsubscribeFunctions: {},
            wsSubscriptions: {
              orderbook: false,
              chart: false
            }
          });
          
          logger.info('すべてのWebSocket購読を解除しました', {
            component: 'useWebSocketStore',
            action: 'unsubscribeAllWebSockets'
          });
        } else {
          // _wsUnsubscribeFunctionsが存在しない場合は初期化だけ行う
          logger.warn('WebSocket購読関数が存在しません', {
            component: 'useWebSocketStore',
            action: 'unsubscribeAllWebSockets',
            wsUnsubscribeFunctions: _wsUnsubscribeFunctions
          });
          
          set({
            _wsUnsubscribeFunctions: {},
            wsSubscriptions: {
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
        const { wsConnected, wsSubscriptions } = get();
        return { connected: wsConnected, subscriptions: wsSubscriptions };
      },
      
      /**
       * 接続状態を更新
       */
      setConnected: (connected: boolean) => {
        set({ wsConnected: connected });
        
        logger.info(`WebSocket接続状態を${connected ? '接続済み' : '切断'}に更新しました`, {
          component: 'useWebSocketStore',
          action: 'setConnected',
          connected
        });
      },
      
      /**
       * 購読状態を更新
       */
      setSubscription: (type: 'orderbook' | 'chart', subscribed: boolean, unsubscribeFunction?: () => void) => {
        // 購読状態を更新
        set(state => ({
          wsSubscriptions: {
            ...state.wsSubscriptions,
            [type]: subscribed
          }
        }));
        
        // 購読解除関数を保存または削除
        if (subscribed && unsubscribeFunction) {
          set(state => ({
            _wsUnsubscribeFunctions: {
              ...state._wsUnsubscribeFunctions,
              [type]: unsubscribeFunction
            }
          }));
          
          logger.info(`${type}の購読を開始しました`, {
            component: 'useWebSocketStore',
            action: 'setSubscription',
            type,
            subscribed
          });
        } else if (!subscribed) {
          // 購読解除関数を実行
          const { _wsUnsubscribeFunctions } = get();
          const unsubscribe = _wsUnsubscribeFunctions[type];
          
          if (unsubscribe && typeof unsubscribe === 'function') {
            try {
              unsubscribe();
            } catch (error) {
              logger.error(`購読解除中にエラーが発生しました: ${error}`, {
                component: 'useWebSocketStore',
                action: 'setSubscription',
                type,
                error
              });
            }
          }
          
          // 購読解除関数を削除
          set(state => {
            const newUnsubscribeFunctions = { ...state._wsUnsubscribeFunctions };
            delete newUnsubscribeFunctions[type];
            
            return {
              _wsUnsubscribeFunctions: newUnsubscribeFunctions
            };
          });
          
          logger.info(`${type}の購読を解除しました`, {
            component: 'useWebSocketStore',
            action: 'setSubscription',
            type,
            subscribed
          });
        }
      }
    }),
    { name: 'websocket-store' }
  )
);

// WebSocketの接続状態を監視する
// 循環参照を避けるために、socketServiceを動的にインポートする
let checkIntervalId: NodeJS.Timeout | null = null;
let socketServiceInstance: any = null;

// ブラウザ環境でのみ実行
if (typeof window !== 'undefined') {
  // 遅延初期化
  setTimeout(async () => {
    try {
      // 動的インポート
      const socketServiceModule = await import('../services/socket/index');
      socketServiceInstance = socketServiceModule.getSocketService();
      
      // 初期接続状態を設定
      if (socketServiceInstance) {
        // isConnectedメソッドが存在するか確認
        const isConnected = typeof socketServiceInstance.isConnected === 'function' 
          ? socketServiceInstance.isConnected()
          : false;
        useWebSocketStore.getState().setConnected(isConnected);
      }
      
      // 定期的にWebSocketの接続状態を確認
      checkIntervalId = setInterval(() => {
        try {
          // socketServiceInstanceが初期化されていない場合は初期化
          if (!socketServiceInstance) {
            socketServiceInstance = getSocketService();
          }
          
          if (!socketServiceInstance) {
            logger.warn('socketServiceInstanceがまだ初期化されていません', {
              component: 'useWebSocketStore',
              action: 'checkWebSocketConnection'
            });
            return;
          }
          
          // isConnectedメソッドが存在するか確認
          const isConnected = typeof socketServiceInstance.isConnected === 'function'
            ? socketServiceInstance.isConnected()
            : (socketServiceInstance.webSocketClient?.isConnected 
                ? socketServiceInstance.webSocketClient.isConnected() 
                : false);
          
          const currentConnected = useWebSocketStore.getState().wsConnected;
          
          // 接続状態が変わった場合
          if (isConnected !== currentConnected) {
            useWebSocketStore.getState().setConnected(isConnected);
            
            // 接続された場合は何もしない（各ストアが必要に応じて購読を開始する）
            // 切断された場合は購読状態をリセット
            if (!isConnected) {
              useWebSocketStore.getState().unsubscribeAllWebSockets();
            }
          }
        } catch (error) {
          logger.error(`WebSocket接続状態の確認中にエラーが発生しました: ${error}`, {
            component: 'useWebSocketStore',
            action: 'checkWebSocketConnection',
            error
          });
        }
      }, 10000); // 10秒ごとにチェック
      
      logger.info(`Successfully initialized WebSocket monitoring`, {
        component: 'useWebSocketStore',
        action: 'initializeWebSocketMonitoring'
      });
    } catch (error) {
      logger.error(`Failed to initialize WebSocket monitoring: ${error}`, {
        component: 'useWebSocketStore',
        action: 'initializeWebSocketMonitoring',
        error
      });
    }
  }, 1000); // 1秒後に初期化
}

// クリーンアップ関数
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (checkIntervalId) {
      clearInterval(checkIntervalId);
      checkIntervalId = null;
    }
  });
}

// デフォルトエクスポート
export default useWebSocketStore;