/**
 * services/socket/index.ts
 * 外部向けSocket機能のインターフェースを提供
 *
 * 変更内容:
 * - 2025-05-12: WebSocketサービスのリファクタリングの一環として更新
 * - 各コンポーネントを分離し、明確な責任分担を実現
 * - 後方互換性を維持しつつ、モジュール構造を改善
 */

// インターフェース
export * from './interfaces';

// 実装クラス
export { WebSocketClient, getWebSocketClient } from './websocket-client';
export { SubscriptionManager, getSubscriptionManager } from './subscription-manager';
export { BitgetIntegration, getBitgetIntegration } from './bitget-integration';
export { MockSocketService, getMockSocketService } from './mock-service';
export { SocketService } from './socket-service';
export { default as default } from './socket-service';

// ファクトリー関数
export { 
  getSocketService, 
  createCustomSocketService, 
  getMockService, 
  resetInstances 
} from './factory';



// 後方互換性のために socketService もエクスポート
// 注: 実際のインスタンスは factory.ts で管理
import { getSocketService } from './factory';
export const socketService = getSocketService();
