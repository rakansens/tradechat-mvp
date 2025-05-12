/**
 * services/socket/factory.ts
 * WebSocketサービスのインスタンス生成と依存性注入を担当
 * 
 * 作成: 2025-05-12 - WebSocketサービスのリファクタリングの一環として
 * 変更: 各コンポーネントのシングルトン管理を一元化
 */

import { ISocketService, IWebSocketClient, ISubscriptionManager, IBitgetIntegration } from './interfaces';
import { getWebSocketClient } from './websocket-client';
import { getSubscriptionManager } from './subscription-manager';
import { getBitgetIntegration } from './bitget-integration';
import { MockSocketService, getMockSocketService } from './mock-service';
// 相対パスでインポート
import { SocketService } from './socket-service';
import { logger } from '../../utils/logger';

// シングルトンインスタンス
let socketServiceInstance: ISocketService | null = null;

/**
 * 環境に応じたSocketServiceインスタンスを取得
 * @param useMock モックサービスを使用するかどうか
 * @returns SocketServiceインスタンス
 */
export function getSocketService(useMock: boolean = false): ISocketService {
  // サーバーサイドレンダリング時は新しいインスタンスを作成
  if (typeof window === 'undefined') {
    logger.info('サーバーサイドレンダリング環境でSocketServiceを作成', {
      component: 'SocketServiceFactory',
      action: 'getSocketService'
    });
    return useMock ? new MockSocketService() : createSocketService();
  }
  
  // モックサービスを使用する場合
  if (useMock) {
    logger.info('モックSocketServiceを使用', {
      component: 'SocketServiceFactory',
      action: 'getSocketService'
    });
    return getMockSocketService();
  }
  
  // 既存のインスタンスがあれば再利用
  if (socketServiceInstance) {
    return socketServiceInstance as ISocketService;
  }
  
  // 新しいインスタンスを作成
  socketServiceInstance = createSocketService();
  
  // 初期化
  if (socketServiceInstance) {
    socketServiceInstance.initializeMarketSocket();
  }
  
  logger.info('新しいSocketServiceインスタンスを作成', {
    component: 'SocketServiceFactory',
    action: 'getSocketService'
  });
  
  return socketServiceInstance as ISocketService;
}

/**
 * 新しいSocketServiceインスタンスを作成
 * @returns 新しいSocketServiceインスタンス
 */
function createSocketService(): SocketService {
  // 循環参照を防止するため、シングルトンインスタンスを取得
  const webSocketClient = getWebSocketClient();
  const subscriptionManager = getSubscriptionManager(webSocketClient);
  const bitgetIntegration = getBitgetIntegration();
  
  return new SocketService(webSocketClient, subscriptionManager, bitgetIntegration);
}

/**
 * 依存コンポーネントをカスタマイズしてSocketServiceインスタンスを作成
 * テストやカスタム構成で使用
 * 
 * @param webSocketClient WebSocketクライアント
 * @param subscriptionManager サブスクリプションマネージャー
 * @param bitgetIntegration BitgetAPI統合
 * @returns カスタマイズされたSocketServiceインスタンス
 */
export function createCustomSocketService(
  webSocketClient?: IWebSocketClient,
  subscriptionManager?: ISubscriptionManager,
  bitgetIntegration?: IBitgetIntegration
): ISocketService {
  return new SocketService(
    webSocketClient || getWebSocketClient(),
    subscriptionManager || getSubscriptionManager(webSocketClient),
    bitgetIntegration || getBitgetIntegration()
  );
}

/**
 * テスト用のモックSocketServiceインスタンスを取得
 * @returns モックSocketServiceインスタンス
 */
export function getMockService(): ISocketService {
  return getMockSocketService();
}

/**
 * シングルトンインスタンスをリセット
 * 主にテスト用
 */
export function resetInstances(): void {
  socketServiceInstance = null;
}
