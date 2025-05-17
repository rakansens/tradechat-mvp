/**
 * services/socket/subscription-manager.ts
 * 各種データの購読管理を担当
 * 
 * 作成: 2025-05-12 - WebSocketサービスのリファクタリングの一環として
 * 変更: subscription.tsを改良し、インターフェースに準拠
 */

import { Socket } from 'socket.io-client';
import { OrderBookData } from '../../types/market';
import { OHLCData, Timeframe } from '../../types/chart';
import { ProductType } from '../../types/api';
import { normalizeSymbol } from '../../lib/utils';
import { logger } from '../../utils/logger';
import { ISubscriptionManager, IWebSocketClient } from './interfaces';
import { getWebSocketClient } from './websocket-client';

// チャンネル名の定数
export const CHANNEL = {
  ORDERBOOK: 'orderbook',
  KLINE: 'kline',
  TRADE: 'trade',
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe'
};

/**
 * サブスクリプション情報の型定義
 */
interface SubscriptionInfo {
  symbol: string;
  type: string;
  exchangeType: ProductType;
  timeframe?: Timeframe;
  callback: Function;
  handler: Function;
}

/**
 * データ購読管理クラス
 * 各種マーケットデータの購読と購読解除を担当
 */
export class SubscriptionManager implements ISubscriptionManager {
  // WebSocketクライアント
  private webSocketClient: IWebSocketClient;
  
  // アクティブな購読を保持するマップ
  private activeSubscriptions: Map<string, SubscriptionInfo> = new Map();

  /**
   * コンストラクタ
   * @param webSocketClient WebSocketクライアント
   */
  constructor(webSocketClient?: IWebSocketClient) {
    this.webSocketClient = webSocketClient || getWebSocketClient();
  }

  /**
   * オーダーブックデータを購読
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @returns 購読解除用の関数
   */
  subscribeOrderBook(
    symbol: string,
    callback: (data: OrderBookData) => void,
    exchangeType: ProductType = 'spot'
  ): () => void {
    try {
      const socket = this.webSocketClient.getSocket();
      if (!socket) {
        logger.error('ソケットが初期化されていません', {
          component: 'SubscriptionManager',
          action: 'subscribeOrderBook'
        });
        return () => {};
      }
      
      // シンボルを正規化
      const normalizedSymbol = normalizeSymbol(symbol);
      
      // サブスクリプションキーの生成
      const subKey = `${CHANNEL.ORDERBOOK}:${normalizedSymbol}:${exchangeType}`;
      
      // 既存の購読があれば解除
      if (this.activeSubscriptions.has(subKey)) {
        this.unsubscribe(subKey);
      }
      
      // サブスクリプションリクエストの送信
      socket.emit(CHANNEL.SUBSCRIBE, {
        symbol: normalizedSymbol,
        type: CHANNEL.ORDERBOOK,
        exchangeType
      });
      
      // データ受信ハンドラの設定
      const handleData = (data: any) => {
        if ((data.symbol === normalizedSymbol || data.symbol === symbol) && data.exchangeType === exchangeType) {
          // データの変換
          const orderBookData: OrderBookData = {
            symbol: data.symbol,
            timestamp: data.timestamp,
            asks: data.data.asks.map((ask: [string, string] | any) => {
              // 配列形式の場合はそのまま返す
              if (Array.isArray(ask)) {
                return ask;
              }
              // オブジェクト形式の場合はOrderBookEntryとして返す
              return {
                price: typeof ask.price === 'string' ? parseFloat(ask.price) : ask.price,
                amount: typeof ask.amount === 'string' ? parseFloat(ask.amount) : ask.amount
              };
            }),
            bids: data.data.bids.map((bid: [string, string] | any) => {
              // 配列形式の場合はそのまま返す
              if (Array.isArray(bid)) {
                return bid;
              }
              // オブジェクト形式の場合はOrderBookEntryとして返す
              return {
                price: typeof bid.price === 'string' ? parseFloat(bid.price) : bid.price,
                amount: typeof bid.amount === 'string' ? parseFloat(bid.amount) : bid.amount
              };
            })
          };
          
          // コールバック関数の呼び出し
          callback(orderBookData);
        }
      };
      
      // イベントリスナーの登録
      socket.on(CHANNEL.ORDERBOOK, handleData);
      
      // アクティブな購読に追加
      this.activeSubscriptions.set(subKey, {
        symbol: normalizedSymbol,
        type: CHANNEL.ORDERBOOK,
        exchangeType,
        callback,
        handler: handleData
      });
      
      logger.info(`オーダーブック購読開始: ${normalizedSymbol} (${exchangeType})`, {
        component: 'SubscriptionManager',
        action: 'subscribeOrderBook',
        symbol: normalizedSymbol,
        exchangeType
      });
      
      // 購読解除関数を返す
      return () => this.unsubscribe(subKey);
    } catch (error) {
      logger.error('オーダーブック購読エラー:', error, {
        component: 'SubscriptionManager',
        action: 'subscribeOrderBook',
        symbol,
        exchangeType,
        error
      });
      return () => {};
    }
  }

  /**
   * ローソク足データを購読
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param timeframe 時間枠（例: '1m', '1h'）
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @returns 購読解除用の関数
   */
  subscribeKline(
    symbol: string,
    timeframe: Timeframe,
    callback: (data: OHLCData) => void,
    exchangeType: ProductType = 'spot'
  ): () => void {
    try {
      const socket = this.webSocketClient.getSocket();
      if (!socket) {
        logger.error('ソケットが初期化されていません', {
          component: 'SubscriptionManager',
          action: 'subscribeKline'
        });
        return () => {};
      }
      
      // シンボルを正規化
      const normalizedSymbol = normalizeSymbol(symbol);
      
      // サブスクリプションキーの生成
      const subKey = `${CHANNEL.KLINE}:${normalizedSymbol}:${timeframe}:${exchangeType}`;
      
      // 既存の購読があれば解除
      if (this.activeSubscriptions.has(subKey)) {
        this.unsubscribe(subKey);
      }
      
      // サブスクリプションリクエストの送信
      socket.emit(CHANNEL.SUBSCRIBE, {
        symbol: normalizedSymbol,
        type: CHANNEL.KLINE,
        timeframe,
        exchangeType
      });
      
      // データ受信ハンドラの設定
      const handleData = (data: any) => {
        if (
          (data.symbol === normalizedSymbol || data.symbol === symbol) &&
          data.timeframe === timeframe &&
          data.exchangeType === exchangeType
        ) {
          // データの変換
          const klineData: OHLCData = {
            time: data.timestamp || Date.now(),
            open: typeof data.data.open === 'string' ? parseFloat(data.data.open) : data.data.open,
            high: typeof data.data.high === 'string' ? parseFloat(data.data.high) : data.data.high,
            low: typeof data.data.low === 'string' ? parseFloat(data.data.low) : data.data.low,
            close: typeof data.data.close === 'string' ? parseFloat(data.data.close) : data.data.close,
            volume: typeof data.data.volume === 'string' ? parseFloat(data.data.volume) : data.data.volume
          };
          
          // コールバック関数の呼び出し
          callback(klineData);
        }
      };
      
      // イベントリスナーの登録
      socket.on(CHANNEL.KLINE, handleData);
      
      // アクティブな購読に追加
      this.activeSubscriptions.set(subKey, {
        symbol: normalizedSymbol,
        type: CHANNEL.KLINE,
        timeframe,
        exchangeType,
        callback,
        handler: handleData
      });
      
      logger.info(`ローソク足購読開始: ${normalizedSymbol} ${timeframe} (${exchangeType})`, {
        component: 'SubscriptionManager',
        action: 'subscribeKline',
        symbol: normalizedSymbol,
        timeframe,
        exchangeType
      });
      
      // 購読解除関数を返す
      return () => this.unsubscribe(subKey);
    } catch (error) {
      logger.error('ローソク足購読エラー:', error, {
        component: 'SubscriptionManager',
        action: 'subscribeKline',
        symbol,
        timeframe,
        exchangeType,
        error
      });
      return () => {};
    }
  }

  /**
   * 取引データを購読
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @returns 購読解除用の関数
   */
  subscribeTrades(
    symbol: string,
    callback: (data: any) => void,
    exchangeType: ProductType = 'spot'
  ): () => void {
    try {
      const socket = this.webSocketClient.getSocket();
      if (!socket) {
        logger.error('ソケットが初期化されていません', {
          component: 'SubscriptionManager',
          action: 'subscribeTrades'
        });
        return () => {};
      }
      
      // シンボルを正規化
      const normalizedSymbol = normalizeSymbol(symbol);
      
      // サブスクリプションキーの生成
      const subKey = `${CHANNEL.TRADE}:${normalizedSymbol}:${exchangeType}`;
      
      // 既存の購読があれば解除
      if (this.activeSubscriptions.has(subKey)) {
        this.unsubscribe(subKey);
      }
      
      // サブスクリプションリクエストの送信
      socket.emit(CHANNEL.SUBSCRIBE, {
        symbol: normalizedSymbol,
        type: CHANNEL.TRADE,
        exchangeType
      });
      
      // データ受信ハンドラの設定
      const handleData = (data: any) => {
        if ((data.symbol === normalizedSymbol || data.symbol === symbol) && data.exchangeType === exchangeType) {
          // コールバック関数の呼び出し
          callback(data);
        }
      };
      
      // イベントリスナーの登録
      socket.on(CHANNEL.TRADE, handleData);
      
      // アクティブな購読に追加
      this.activeSubscriptions.set(subKey, {
        symbol: normalizedSymbol,
        type: CHANNEL.TRADE,
        exchangeType,
        callback,
        handler: handleData
      });
      
      logger.info(`取引データ購読開始: ${normalizedSymbol} (${exchangeType})`, {
        component: 'SubscriptionManager',
        action: 'subscribeTrades',
        symbol: normalizedSymbol,
        exchangeType
      });
      
      // 購読解除関数を返す
      return () => this.unsubscribe(subKey);
    } catch (error) {
      logger.error('取引データ購読エラー:', error, {
        component: 'SubscriptionManager',
        action: 'subscribeTrades',
        symbol,
        exchangeType,
        error
      });
      return () => {};
    }
  }

  /**
   * 特定の購読を解除
   * @param subKey 購読キー
   */
  private unsubscribe(subKey: string): void {
    try {
      const socket = this.webSocketClient.getSocket();
      if (!socket) {
        logger.error('ソケットが初期化されていません', {
          component: 'SubscriptionManager',
          action: 'unsubscribe',
          subKey
        });
        return;
      }
      
      const subscription = this.activeSubscriptions.get(subKey);
      if (!subscription) {
        logger.warn(`購読が見つかりません: ${subKey}`, {
          component: 'SubscriptionManager',
          action: 'unsubscribe',
          subKey
        });
        return;
      }
      
      // イベントリスナーの削除
      socket.off(subscription.type, subscription.handler as any);
      
      // サブスクリプション解除リクエストの送信
      socket.emit(CHANNEL.UNSUBSCRIBE, {
        symbol: subscription.symbol,
        type: subscription.type,
        timeframe: subscription.timeframe,
        exchangeType: subscription.exchangeType
      });
      
      // アクティブな購読から削除
      this.activeSubscriptions.delete(subKey);
      
      logger.info(`購読解除: ${subKey}`, {
        component: 'SubscriptionManager',
        action: 'unsubscribe',
        subKey
      });
    } catch (error) {
      logger.error('購読解除エラー:', error, {
        component: 'SubscriptionManager',
        action: 'unsubscribe',
        subKey,
        error
      });
    }
  }

  /**
   * すべての購読を解除
   */
  unsubscribeAll(): void {
    try {
      const socket = this.webSocketClient.getSocket();
      if (!socket) {
        logger.error('ソケットが初期化されていません', {
          component: 'SubscriptionManager',
          action: 'unsubscribeAll'
        });
        return;
      }
      
      // すべての購読を解除
      for (const [subKey, subscription] of this.activeSubscriptions.entries()) {
        // イベントリスナーの削除
        socket.off(subscription.type, subscription.handler as any);
        
        // サブスクリプション解除リクエストの送信
        socket.emit(CHANNEL.UNSUBSCRIBE, {
          symbol: subscription.symbol,
          type: subscription.type,
          timeframe: subscription.timeframe,
          exchangeType: subscription.exchangeType
        });
        
        logger.info(`購読解除: ${subKey}`, {
          component: 'SubscriptionManager',
          action: 'unsubscribeAll',
          subKey
        });
      }
      
      // アクティブな購読をクリア
      this.activeSubscriptions.clear();
      
      logger.info('すべての購読を解除しました', {
        component: 'SubscriptionManager',
        action: 'unsubscribeAll'
      });
    } catch (error) {
      logger.error('すべての購読解除エラー:', error, {
        component: 'SubscriptionManager',
        action: 'unsubscribeAll',
        error
      });
    }
  }

  /**
   * すべての購読を再購読
   */
  resubscribeAll(): void {
    try {
      const socket = this.webSocketClient.getSocket();
      if (!socket) {
        logger.error('ソケットが初期化されていません', {
          component: 'SubscriptionManager',
          action: 'resubscribeAll'
        });
        return;
      }
      
      // 現在のアクティブな購読を保存
      const subscriptions = Array.from(this.activeSubscriptions.values());
      
      // すべての購読を解除
      this.unsubscribeAll();
      
      // すべての購読を再購読
      for (const subscription of subscriptions) {
        // サブスクリプションリクエストの送信
        socket.emit(CHANNEL.SUBSCRIBE, {
          symbol: subscription.symbol,
          type: subscription.type,
          timeframe: subscription.timeframe,
          exchangeType: subscription.exchangeType
        });
        
        // イベントリスナーの登録
        socket.on(subscription.type, subscription.handler as any);
        
        // アクティブな購読に追加
        const subKey = `${subscription.type}:${subscription.symbol}:${subscription.timeframe || ''}:${subscription.exchangeType}`.replace(/::/, ':');
        this.activeSubscriptions.set(subKey, subscription);
        
        logger.info(`再購読: ${subKey}`, {
          component: 'SubscriptionManager',
          action: 'resubscribeAll',
          subKey
        });
      }
      
      logger.info('すべての購読を再購読しました', {
        component: 'SubscriptionManager',
        action: 'resubscribeAll',
        count: subscriptions.length
      });
    } catch (error) {
      logger.error('すべての再購読エラー:', error, {
        component: 'SubscriptionManager',
        action: 'resubscribeAll',
        error
      });
    }
  }
}

// シングルトンインスタンス
let subscriptionManagerInstance: SubscriptionManager | null = null;

/**
 * SubscriptionManagerのシングルトンインスタンスを取得
 * @param webSocketClient WebSocketクライアント（オプション）
 * @returns SubscriptionManagerインスタンス
 */
export function getSubscriptionManager(webSocketClient?: IWebSocketClient): SubscriptionManager {
  if (!subscriptionManagerInstance) {
    subscriptionManagerInstance = new SubscriptionManager(webSocketClient);
  }
  return subscriptionManagerInstance;
}
