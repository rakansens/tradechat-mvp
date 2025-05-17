// store/socket/dispatcher.ts
// 作成: 2025-05-10 - Socket-IOイベントをSliceアクションに変換するディスパッチャー
// 更新: 2025-05-10 - 依存関係と型の修正
// 更新: 2025-05-10 - インポートパスの修正
// 更新: 2025-05-10 - より簡素なエクスポートと型アサーションの使用
// 更新: 2025-05-14 - 型安全性の向上と循環参照の解決
// 更新: 2025-05-14 - ソケットスライスの参照パスを修正
// 更新: 2025-05-14 - 動的インポートを最適化して、Webpackの警告を解消
// 更新: 2025-05-15 - useSymbolStoreの参照を削除し、代わりにuseRootStoreを使用
// 更新: 2025-05-31 - useChartDataStoreの参照を削除し、rootStoreを直接使用
// WebSocket接続監視と副作用の管理

import { ExchangeType, Timeframe, ProductType } from '@/types/constants/enums';
import { logger } from '@/utils/common';
import { getSocketService } from '@/services/socket';
import { useRootStore } from '@/store/rootStore';
import type { RootStore } from '@/store/rootStore';
import { toProductType } from '@/utils/exchange';

// 循環参照を避けるための前方参照型
// @deprecated - ChartDataStoreTypeはrootStoreに統合済み
type DataServiceType = {
  chartDataService: {
    clearCacheOnSymbolChange: (symbol: string) => void;
  };
};

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
 * ストアのパスを明示的に指定して、動的インポートを行う
 * @param storePath ストアのパス
 * @returns ストアのPromise
 */
const importStore = async <T>(storePath: string): Promise<T | null> => {
  try {
    // 明示的に各ストアへのパスを指定
    if (storePath === '@/services/data') {
      return await import('@/services/data/index.js') as unknown as T;
    } else if (storePath === '@/store/socket/index') {
      return (await import('@/store/rootStore.js')).useRootStore.getState() as T;
    }
    return null;
  } catch (e) {
    logger.error(`インポートエラー: ${storePath}`, {
      component: 'SocketDispatcher',
      error: e
    });
    return null;
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
    const rootStore = useRootStore.getState();
    
    switch (event) {
      case 'symbol':
        // シンボル変更イベント
        rootStore.setCurrentSymbol(payload as string, 'SocketDispatcher');
        break;
        
      case 'exchangeType':
        // 取引タイプ変更イベント
        const exchangeType = payload as ExchangeType;
        // ExchangeType を ProductType に変換
        // 更新: 2025-05-17 - toExchangeProductTypeからtoProductTypeに変更
        const productType = toProductType(exchangeType);
        
        // 新しいメソッドを使用
        if (rootStore.setProductType) {
          rootStore.setProductType(productType);
        } else {
          // 後方互換性のために古いメソッドも使用可能にしておく
          rootStore.setExchangeType(productType);
        }
        break;
        
      case 'timeframe':
        // 時間足変更イベント - rootStoreを直接使用
        rootStore.updateTimeFrame(payload as Timeframe);
        
        // キャッシュもクリアする
        importStore<DataServiceType>('@/services/data').then(dataService => {
          if (dataService) {
            const currentSymbol = rootStore.currentSymbol;
            dataService.chartDataService.clearCacheOnSymbolChange(currentSymbol);
          }
        });
        break;
        
      case 'connected':
        // 接続状態変更イベント
        rootStore.setConnected(payload as boolean);
        break;
        
      case 'socketId':
        // ソケットID変更イベント
        rootStore.setSocketId(payload as string);
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

          // 接続状態が変化した場合のみ更新
          if (currentConnected !== isConnected) {
            store.setConnected(isConnected);
          }
        } catch (error) {
          logger.error('WebSocket接続状態チェック中にエラーが発生しました', {
            component: 'SocketDispatcher',
            action: 'checkWebSocketConnection',
            error
          });
        }
      }, 10 * 1000); // 10秒ごとに確認
      
      // アンロード時にクリーンアップ
      window.addEventListener('beforeunload', () => {
        if (checkIntervalId !== null) {
          clearInterval(checkIntervalId);
          checkIntervalId = null;
        }

        // ストアのアンサブスクライブ
        if (useRootStore) {
          const store = useRootStore.getState();
          // すべての購読を解除
          if (typeof store.unsubscribeAll === 'function') {
            store.unsubscribeAll();
          }
        }
      });
      
    } catch (error) {
      logger.error('Socket監視の初期化中にエラーが発生しました', {
        component: 'SocketDispatcher',
        action: 'initializeSocketMonitoring',
        error
      });
    }
  }, 1000); // 1秒後に初期化
};

/**
 * WebSocket接続監視のクリーンアップ
 */
export const cleanupSocketMonitoring = () => {
  // ブラウザ環境でのみ実行
  if (typeof window === 'undefined') return;
  
  if (checkIntervalId !== null) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
  }
  
  // ストアのアンサブスクライブ
  if (useRootStore) {
    const store = useRootStore.getState();
    // すべての購読を解除
    if (typeof store.unsubscribeAll === 'function') {
      store.unsubscribeAll();
    }
  }
};

// ブラウザ環境の場合、自動的に初期化
if (typeof window !== 'undefined') {
  // NextJSのHydrationエラーを防ぐため、ブラウザでのみ初期化
  setTimeout(() => {
    initializeSocketMonitoring();
  }, 0);
} 