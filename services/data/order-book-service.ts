/**
 * services/data/order-book-service.ts
 * オーダーブックサービスの実装
 * 
 * 作成: 2025-05-12 - オーダーブックデータの取得と管理を担当するサービス
 * SRPに基づいてdataFetchServiceから分離
 */

import { EventEmitter } from 'events';
import { BitgetApiClient } from '../api/bitget/client';
import { IOrderBookService } from '../api/interfaces';
import { OrderBookData } from '../../types/chart';
import { ExchangeType } from '../../types/api';
import { logger } from '../../utils/logger';
import { normalizeSymbol } from '../../utils/formatters';
import { getSocketService } from '../socket/service';
import { cacheService } from '../cache/service';

// 環境検出
const isBrowser = typeof window !== 'undefined';

/**
 * オーダーブックサービス
 * オーダーブックデータの取得と管理を担当するサービス
 */
class OrderBookService extends EventEmitter implements IOrderBookService {
  private bitgetApiClient: BitgetApiClient | null = null;
  private subscriptions: Map<string, () => void> = new Map();
  
  /**
   * BitgetApiClientインスタンスを取得または作成
   */
  private getBitgetApiClient(): BitgetApiClient {
    if (!this.bitgetApiClient) {
      this.bitgetApiClient = new BitgetApiClient();
    }
    return this.bitgetApiClient;
  }
  
  /**
   * オーダーブックデータを取得
   * @param symbol シンボル
   * @param exchangeType 取引タイプ
   * @param signal AbortSignal
   * @returns オーダーブックデータ
   */
  async getOrderBook(
    symbol: string,
    exchangeType: ExchangeType,
    signal?: AbortSignal
  ): Promise<OrderBookData> {
    // シンボルを正規化
    const normalizedSymbol = normalizeSymbol(symbol);
    
    // キャッシュキーを生成
    const cacheKey = `orderbook-${normalizedSymbol}-${exchangeType}`;
    
    // キャッシュからデータを取得
    const cachedData = cacheService.get<OrderBookData>(cacheKey);
    if (cachedData) {
      logger.debug(`キャッシュからオーダーブックデータを取得: ${normalizedSymbol}`, {
        component: 'OrderBookService',
        action: 'getOrderBook',
        symbol: normalizedSymbol,
        exchangeType,
        source: 'cache'
      });
      return cachedData;
    }
    
    try {
      logger.info(`REST APIからオーダーブックデータを取得中: ${normalizedSymbol}`, {
        component: 'OrderBookService',
        action: 'getOrderBook',
        symbol: normalizedSymbol,
        exchangeType,
        source: 'rest-api'
      });
      
      // BitgetApiClientを取得
      const bitgetClient = this.getBitgetApiClient();
      
      // REST APIからデータを取得
      const restData = await bitgetClient.fetchOrderBook(normalizedSymbol, 20, exchangeType);
      
      // キャッシュにデータを保存
      cacheService.set(cacheKey, restData, 'rest');
      
      // ログに記録
      logger.info(`REST APIからオーダーブックデータを取得完了: ${normalizedSymbol}`, {
        component: 'OrderBookService',
        action: 'getOrderBook',
        symbol: normalizedSymbol,
        exchangeType,
        source: 'rest-api'
      });
      
      return restData;
    } catch (error) {
      logger.error(`オーダーブック取得エラー: ${error}`, {
        component: 'OrderBookService',
        action: 'getOrderBook',
        symbol: normalizedSymbol,
        exchangeType,
        error
      });
      
      // エラー時はデモデータを返す
      const demoData: OrderBookData = {
        symbol: normalizedSymbol,
        timestamp: Date.now(),
        asks: [
          {
            price: parseFloat(normalizedSymbol.split('/')[0] === 'BTC' ? '30000.00' : '2000.00'),
            amount: 1.0
          }
        ],
        bids: [
          {
            price: parseFloat(normalizedSymbol.split('/')[0] === 'BTC' ? '29900.00' : '1990.00'),
            amount: 1.0
          }
        ]
      };
      
      return demoData;
    }
  }
  
  /**
   * WebSocketを使用してオーダーブックデータをリアルタイム購読
   * @param symbol シンボル
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ
   * @returns 購読解除用の関数
   */
  subscribeOrderBookRealtime(
    symbol: string,
    callback: (data: OrderBookData) => void,
    exchangeType: ExchangeType = 'bitget'
  ): () => void {
    // シンボルを正規化
    const normalizedSymbol = normalizeSymbol(symbol);
    
    // 購読キーを生成
    const subscriptionKey = `orderbook-${normalizedSymbol}-${exchangeType}`;
    
    // 既存の購読があれば解除
    if (this.subscriptions.has(subscriptionKey)) {
      const unsubscribe = this.subscriptions.get(subscriptionKey);
      if (unsubscribe) {
        unsubscribe();
      }
      this.subscriptions.delete(subscriptionKey);
    }
    
    // ブラウザ環境ではポーリングで対応
    if (isBrowser) {
      logger.info(`ブラウザ環境ではポーリングでオーダーブックデータを取得: ${normalizedSymbol}`, {
        component: 'OrderBookService',
        action: 'subscribeOrderBookRealtime',
        symbol: normalizedSymbol,
        exchangeType,
        client: 'polling'
      });
      
      // ポーリング間隔（ミリ秒）
      const pollingInterval = 5000; // 5秒
      
      // ポーリング用のタイマーID
      const timerId = setInterval(async () => {
        try {
          const data = await this.getOrderBook(normalizedSymbol, exchangeType);
          callback(data);
        } catch (error) {
          logger.error(`オーダーブックポーリングエラー: ${error}`, {
            component: 'OrderBookService',
            action: 'subscribeOrderBookRealtime',
            symbol: normalizedSymbol,
            exchangeType,
            error
          });
        }
      }, pollingInterval);
      
      // 購読解除関数を返す
      const unsubscribe = () => {
        clearInterval(timerId);
        this.subscriptions.delete(subscriptionKey);
      };
      
      // 購読を保存
      this.subscriptions.set(subscriptionKey, unsubscribe);
      
      return unsubscribe;
    }
    
    // サーバー環境ではWebSocketを使用
    const socketService = getSocketService();
    
    // WebSocketが接続されていない場合は空の解除関数を返す
    if (!socketService || !socketService.isConnected()) {
      logger.warn(`WebSocketが接続されていないため、オーダーブックの購読ができません: ${normalizedSymbol}`, {
        component: 'OrderBookService',
        action: 'subscribeOrderBookRealtime',
        symbol: normalizedSymbol,
        exchangeType
      });
      return () => {};
    }
    
    // WebSocketサービスを使用
    const unsubscribe = socketService.subscribeOrderBook(
      normalizedSymbol,
      (data: OrderBookData) => {
        // データをキャッシュに保存
        const requestKey = `orderbook-${normalizedSymbol}-${exchangeType}`;
        cacheService.set(requestKey, data, 'websocket');
        
        // コールバック関数を呼び出し
        callback(data);
      },
      exchangeType
    );
    
    logger.info(`WebSocketでオーダーブックのリアルタイム購読を開始: ${normalizedSymbol}`, {
      component: 'OrderBookService',
      action: 'subscribeOrderBookRealtime',
      symbol: normalizedSymbol,
      exchangeType,
      client: 'socket-service'
    });
    
    // 購読を保存
    this.subscriptions.set(subscriptionKey, unsubscribe);
    
    return unsubscribe;
  }
  
  /**
   * すべてのオーダーブック購読を解除
   */
  unsubscribeAllOrderBooks(): void {
    logger.info('すべてのオーダーブック購読を解除', {
      component: 'OrderBookService',
      action: 'unsubscribeAllOrderBooks',
      subscriptionCount: this.subscriptions.size
    });
    
    // すべての購読を解除
    this.subscriptions.forEach((unsubscribe) => {
      unsubscribe();
    });
    
    // 購読リストをクリア
    this.subscriptions.clear();
  }
  
  /**
   * すべての購読を解除
   * @deprecated 代わりにunsubscribeAllOrderBooksを使用してください
   */
  unsubscribeAll(): void {
    // 互換性のためにunsubscribeAllOrderBooksを呼び出す
    this.unsubscribeAllOrderBooks();
  }
}

// シングルトンインスタンスをエクスポート
export const orderBookService = new OrderBookService();
