// store/socket/dispatcher.ts
// 作成: 2025-05-10 - Socket-IOイベントをSliceアクションに変換するディスパッチャー
// 更新: 2025-05-10 - 依存関係と型の修正
// 更新: 2025-05-10 - インポートパスの修正
// 更新: 2025-05-10 - より簡素なエクスポートと型アサーションの使用
// 更新: 2025-05-14 - 型安全性の向上と循環参照の解決
// 更新: 2025-05-14 - ソケットスライスの参照パスを修正
// WebSocket接続監視と副作用の管理

import { ExchangeType } from '@/types/api';
import { Timeframe } from '@/types/chart';
import { logger } from '@/utils/logger';
import { getSocketService } from '@/services/socket';
import { useRootStore } from '@/store/rootStore';
import type { RootStore } from '@/store/rootStore';

/**
 * ソケットイベントタイプ
 */
export type SocketEvent = 
  | 'symbol'
  | 'exchangeType'
  | 'timeframe'
  | 'connected'
  | 'socketId';

/**
 * ソケットイベントのペイロード型
 */
export type SocketPayload<T extends SocketEvent> =
  T extends 'symbol' ? string :
  T extends 'exchangeType' ? ExchangeType :
  T extends 'timeframe' ? Timeframe :
  T extends 'connected' ? boolean :
  T extends 'socketId' ? string :
  never;

/**
 * モジュールを動的にインポートして安全に関数を呼び出す
 * @param modulePath インポートするモジュールのパス
 * @param action 実行するアクション
 * @param payload アクションに渡すデータ
 * @param fieldPath モジュール内で使用するフィールドパス
 * @returns 成功したかどうか
 */
const importAndCall = async <T>(
  modulePath: string,
  action: string,
  payload: any,
  fieldPath: string
): Promise<boolean> => {
  try {
    const module = await import(modulePath);
    logger.debug(`Socket Dispatcher: ${modulePath} 読み込み成功 (${action})`, {
      component: 'SocketDispatcher'
    });
    
    // フィールドパスからオブジェクトとプロパティを取得
    const parts = fieldPath.split('.');
    let obj = module;
    
    // ネストされたプロパティにアクセス
    for (let i = 0; i < parts.length - 1; i++) {
      obj = obj[parts[i]];
      if (!obj) {
        logger.error(`Socket Dispatcher: ${fieldPath} が見つかりません`, {
          component: 'SocketDispatcher',
          path: parts.slice(0, i + 1).join('.')
        });
        return false;
      }
    }
    
    // 最後のプロパティは関数または取得メソッド
    const propName = parts[parts.length - 1];
    const fn = obj[propName];
    
    if (typeof fn === 'function') {
      fn(payload);
      return true;
    } else {
      logger.error(`Socket Dispatcher: ${fieldPath} は関数ではありません`, {
        component: 'SocketDispatcher',
        type: typeof fn
      });
      return false;
    }
  } catch (e) {
    logger.error(`Socket Dispatcher: ${modulePath} 読み込み/実行エラー (${action})`, {
      component: 'SocketDispatcher',
      error: e,
      payload
    });
    return false;
  }
};

/**
 * ソケットイベントをストアアクションに変換してディスパッチする
 * @param event イベント名
 * @param payload イベントデータ
 */
export const storeEmit = <T extends SocketEvent>(event: T, payload: SocketPayload<T>) => {
  logger.debug(`Socket Dispatcher: ${event}イベントを受信`, {
    component: 'SocketDispatcher',
    event,
    payload
  });
  
  try {
    switch (event) {
      case 'symbol':
        // シンボル変更イベント
        importAndCall(
          '@/store/useSymbolStore',
          'setCurrentSymbol',
          payload as string,
          'useSymbolStore.getState().setCurrentSymbol'
        );
        break;
        
      case 'exchangeType':
        // 取引タイプ変更イベント
        importAndCall(
          '@/store/useSymbolStore',
          'setExchangeType',
          payload as ExchangeType,
          'useSymbolStore.getState().setExchangeType'
        );
        break;
        
      case 'timeframe':
        // 時間足変更イベント
        importAndCall(
          '@/store/chart/useChartDataStore',
          'updateTimeFrame',
          payload as Timeframe,
          'useChartDataStore.getState().updateTimeFrame'
        )
          .then(success => {
            if (success) {
              // キャッシュもクリアする
              import('@/services/data').then(module => {
                const { chartDataService } = module;
                import('@/store/useSymbolStore').then(symbolModule => {
                  const currentSymbol = symbolModule.useSymbolStore.getState().currentSymbol;
                  chartDataService.clearCacheOnSymbolChange(currentSymbol);
                });
              });
            }
          });
        break;
        
      case 'connected':
        // 接続状態変更イベント
        importAndCall(
          '@/store/socket/index',
          'setConnected',
          payload as boolean,
          'useSocketStore.getState().setConnected'
        );
        break;
        
      case 'socketId':
        // ソケットID変更イベント
        importAndCall(
          '@/store/socket/index',
          'setSocketId',
          payload as string,
          'useSocketStore.getState().setSocketId'
        );
        break;
        
      default:
        logger.warn(`Socket Dispatcher: 未知のイベント ${event}`, {
          component: 'SocketDispatcher',
          event,
          payload
        });
    }
  } catch (error) {
    logger.error(`Socket Dispatcher: イベント処理エラー ${event}`, {
      component: 'SocketDispatcher',
      event,
      error
    });
  }
};

// 接続チェック用インターバルID
let checkIntervalId: NodeJS.Timeout | null = null;
// socketServiceのインスタンス
let socketServiceInstance: any = null;

/**
 * WebSocket接続監視の初期化
 * - 初回遅延初期化
 * - 定期的な接続状態確認
 * - アンロード時のクリーンアップ
 */
export const initializeSocketMonitoring = () => {
  // ブラウザ環境でのみ実行
  if (typeof window === 'undefined') return;

  // 既に初期化済みの場合は何もしない
  if (checkIntervalId !== null) return;

  // 遅延初期化（アプリ起動直後にサービスが完全に初期化されるのを待つ）
  setTimeout(async () => {
    try {
      // socketServiceを取得
      socketServiceInstance = getSocketService();
      
      // 初期接続状態を設定
      if (socketServiceInstance) {
        // isConnectedメソッドが存在するか確認
        const isConnected = typeof socketServiceInstance.isConnected === 'function' 
          ? socketServiceInstance.isConnected()
          : false;
        
        // ストアの状態を更新
        const store = useRootStore.getState();
        store.setConnected(isConnected);
      }
      
      // 定期的にWebSocketの接続状態を確認（10秒間隔）
      checkIntervalId = setInterval(() => {
        try {
          // socketServiceInstanceが初期化されていない場合は初期化
          if (!socketServiceInstance) {
            socketServiceInstance = getSocketService();
          }
          
          if (!socketServiceInstance) {
            logger.warn('socketServiceInstanceがまだ初期化されていません', {
              component: 'SocketDispatcher',
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
          
          const store = useRootStore.getState();
          const currentConnected = store.connected;
          
          // 接続状態が変わった場合のみ更新
          if (isConnected !== currentConnected) {
            store.setConnected(isConnected);
            
            // 切断された場合は購読状態をリセット
            if (!isConnected && typeof store.unsubscribeAll === 'function') {
              store.unsubscribeAll();
            }
          }
        } catch (error) {
          logger.error(`WebSocket接続状態の確認中にエラーが発生しました: ${error}`, {
            component: 'SocketDispatcher',
            action: 'checkWebSocketConnection',
            error
          });
        }
      }, 10000); // 10秒ごとにチェック
      
      logger.info('WebSocket監視を初期化しました', {
        component: 'SocketDispatcher',
        action: 'initializeSocketMonitoring'
      });
    } catch (error) {
      logger.error(`WebSocket監視の初期化に失敗しました: ${error}`, {
        component: 'SocketDispatcher',
        action: 'initializeSocketMonitoring',
        error
      });
    }
  }, 1000); // 1秒後に初期化開始

  // クリーンアップ関数を登録
  window.addEventListener('beforeunload', cleanupSocketMonitoring);
};

/**
 * WebSocket接続監視のクリーンアップ
 */
export const cleanupSocketMonitoring = () => {
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
  }
  
  // 購読を全て解除
  const store = useRootStore.getState();
  if (typeof store.unsubscribeAll === 'function') {
    store.unsubscribeAll();
  }
  
  logger.info('WebSocket監視をクリーンアップしました', {
    component: 'SocketDispatcher',
    action: 'cleanupSocketMonitoring'
  });
};

// ブラウザ環境の場合、自動的に初期化
if (typeof window !== 'undefined') {
  // NextJSのHydrationエラーを防ぐため、ブラウザでのみ初期化
  setTimeout(() => {
    initializeSocketMonitoring();
  }, 0);
} 