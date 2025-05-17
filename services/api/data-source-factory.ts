/**
 * services/api/data-source-factory.ts
 * データソースファクトリー実装
 * 
 * 作成: 2025-05-12 - SRPに基づいたデータソースファクトリーの実装
 * 
 * このファイルは、IDataSourceFactoryインターフェースに準拠したデータソースファクトリーを実装します。
 * 単一責任の原則（SRP）に基づき、適切なデータソースの作成のみに責任を持ちます。
 */

import { IDataSourceFactory, IRestApiClient, IWebSocketClient } from './interfaces';
import { BitgetWebSocketClient } from './bitget/websocket-client';
import { BitgetRestClient } from './bitget/rest-client';
import { logger } from '../../utils/common';

/**
 * データソースファクトリー
 * IDataSourceFactoryインターフェースを実装
 */
export class DataSourceFactory implements IDataSourceFactory {
  // WebSocketクライアントのキャッシュ
  private wsClients: Map<string, IWebSocketClient> = new Map();
  
  // REST APIクライアントのキャッシュ
  private restClients: Map<string, IRestApiClient> = new Map();
  
  /**
   * WebSocketクライアントを取得
   * @param exchange 取引所名（デフォルト: 'bitget'）
   * @returns WebSocketクライアント
   */
  public getWebSocketClient(exchange: string = 'bitget'): IWebSocketClient {
    // キャッシュからクライアントを取得
    const cachedClient = this.wsClients.get(exchange);
    if (cachedClient) {
      return cachedClient;
    }
    
    // 新しいクライアントを作成
    let client: IWebSocketClient;
    
    switch (exchange.toLowerCase()) {
      case 'bitget':
        client = new BitgetWebSocketClient();
        break;
      // 将来的に他の取引所をサポートする場合はここに追加
      default:
        logger.warn(`未対応の取引所: ${exchange}、Bitgetを使用します`);
        client = new BitgetWebSocketClient();
    }
    
    // クライアントをキャッシュに保存
    this.wsClients.set(exchange, client);
    
    return client;
  }
  
  /**
   * REST APIクライアントを取得
   * @param exchange 取引所名（デフォルト: 'bitget'）
   * @returns REST APIクライアント
   */
  public getRestApiClient(exchange: string = 'bitget'): IRestApiClient {
    // キャッシュからクライアントを取得
    const cachedClient = this.restClients.get(exchange);
    if (cachedClient) {
      return cachedClient;
    }
    
    // 新しいクライアントを作成
    let client: IRestApiClient;
    
    switch (exchange.toLowerCase()) {
      case 'bitget':
        client = new BitgetRestClient();
        break;
      // 将来的に他の取引所をサポートする場合はここに追加
      default:
        logger.warn(`未対応の取引所: ${exchange}、Bitgetを使用します`);
        client = new BitgetRestClient();
    }
    
    // クライアントをキャッシュに保存
    this.restClients.set(exchange, client);

    return client;
  }

  /**
   * 保持しているクライアントをすべて破棄
   */
  public reset(): void {
    this.wsClients.forEach((client) => {
      try {
        client.disconnect();
      } catch (error) {
        logger.warn('WebSocket client disconnect failed', { error });
      }
    });
    this.wsClients.clear();
    this.restClients.clear();
  }
}

// シングルトンインスタンスをエクスポート
export const dataSourceFactory = new DataSourceFactory();

/**
 * DataSourceFactoryインスタンスをリセット
 */
export function resetDataSourceFactory(): void {
  dataSourceFactory.reset();
}
