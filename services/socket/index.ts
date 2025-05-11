/**
 * services/socket/index.ts
 * 外部向けSocket機能のインターフェースを提供
 *
 * 変更内容:
 * - 元のsocketService.tsからインターフェース部分を分離
 * - 後方互換性を維持しつつ、リファクタリングされたモジュールを統合
 * - シングルトンパターンを実装
 */

import { Socket } from 'socket.io-client';
import { ExchangeType } from '../../types/api';
import { OrderBookData } from '../../types/market';
import { OHLCData } from '../../types/chart';
import { getSocketClient, SocketClient } from './client';
import { getSubscriptionManager, SubscriptionManager } from './subscription';
import { BitgetApiClient } from '../bitgetApi';
import { emitEvent, getSocket } from '../../utils/socketClient';
import { logger } from '../../utils/logger';

/**
 * Socket通信サービス
 * Socket.IOとBitgetAPIを統合し、データ購読機能を提供
 */
export class SocketService {
  private client: SocketClient;
  private subscriptionManager: SubscriptionManager;
  private bitgetApi: BitgetApiClient | null = null;

  constructor() {
    this.client = getSocketClient();
    this.subscriptionManager = getSubscriptionManager();
  }

  /**
   * マーケットデータ用のSocket.IO接続を初期化
   * @returns Socket.IOのソケットインスタンス
   */
  initializeMarketSocket(): Socket | null {
    return this.client.initialize();
  }

  /**
   * 特定の取引タイプに対応したBitgetApiClientを初期化
   * 
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @param config 追加の設定オプション
   * @returns BitgetApiClientインスタンス
   */
  initializeApiClient(exchangeType: ExchangeType, config: Record<string, any> = {}): BitgetApiClient {
    try {
      // 既存のAPIクライアントがあれば切断
      if (this.bitgetApi) {
        this.bitgetApi.disconnectWebSocket();
      }
      
      // 新しいAPIクライアントを作成
      this.bitgetApi = new BitgetApiClient(config, exchangeType);
      
      logger.info('BitgetApiClient初期化成功', {
        component: 'SocketService',
        action: 'initializeApiClient',
        exchangeType
      });
      
      return this.bitgetApi;
    } catch (error) {
      logger.error('BitgetApiClient初期化エラー:', error, {
        component: 'SocketService',
        action: 'initializeApiClient',
        exchangeType
      });
      
      // エラーが発生した場合でもクライアントを返す（エラーハンドリングは呼び出し側で行う）
      this.bitgetApi = new BitgetApiClient(config, exchangeType);
      return this.bitgetApi;
    }
  }

  /**
   * 現在のBitgetApiClientインスタンスを取得
   * @returns 現在のBitgetApiClientインスタンス
   */
  getCurrentApiClient(): BitgetApiClient | null {
    return this.bitgetApi;
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
    exchangeType: ExchangeType = 'spot'
  ): () => void {
    return this.subscriptionManager.subscribeOrderBook(symbol, callback, exchangeType);
  }

  /**
   * ローソク足データを購読
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param timeframe タイムフレーム（例: '1m', '5m', '1h', '1d'）
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @returns 購読解除用の関数
   */
  subscribeKline(
    symbol: string,
    timeframe: string,
    callback: (data: OHLCData) => void,
    exchangeType: ExchangeType = 'spot'
  ): () => void {
    return this.subscriptionManager.subscribeKline(symbol, timeframe, callback, exchangeType);
  }

  /**
   * 取引データを購読
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @returns 購読解除用の関数
   */
  subscribeTrade(
    symbol: string,
    callback: (data: any) => void,
    exchangeType: ExchangeType = 'spot'
  ): () => void {
    return this.subscriptionManager.subscribeTrade(symbol, callback, exchangeType);
  }

  /**
   * すべてのソケット接続を切断
   */
  disconnectAll(): void {
    try {
      if (this.bitgetApi) {
        this.bitgetApi.disconnectWebSocket();
        this.bitgetApi = null;
      } else {
        // デフォルトの spot クライアントを作成 (テスト用)
        const tempClient = new BitgetApiClient({}, 'spot' as ExchangeType);
        tempClient.disconnectWebSocket();
      }

      // すべてのサブスクリプションを解除
      this.subscriptionManager.unsubscribeAll();

      // ソケット接続を切断
      this.client.disconnect();

      logger.info('すべてのソケット接続を切断しました', {
        component: 'SocketService',
        action: 'disconnectAll'
      });
    } catch (error) {
      logger.error('ソケット切断エラー:', error, {
        component: 'SocketService',
        action: 'disconnectAll'
      });
    }
  }

  /**
   * 時間足変更イベントを発行
   * @param timeframe 変更する時間足（例：1m, 5m, 15m, 1h, 4h, 1d）
   * @returns 成功した場合はtrue、失敗した場合はfalse
   */
  emitTimeframeChange(timeframe: string): Promise<boolean> {
    try {
      const socket = getSocket(false);
      if (!socket) {
        // 自動初期化も失敗した場合
        logger.warn('ソケット接続がありません。時間足変更イベントを発行できません。', {
          component: 'SocketService',
          action: 'emitTimeframeChange',
          timeframe
        });
        return Promise.resolve(false);
      }
      
      // 接続確認
      if (!socket.connected) {
        logger.warn('ソケットは初期化されていますが、接続されていません。', {
          component: 'SocketService',
          action: 'emitTimeframeChange',
          timeframe
        });
      }

      return new Promise((resolve) => {
        emitEvent('changeTimeframe', { timeframe }, (response: { success: boolean }) => {
          if (response && response.success) {
            logger.info(`時間足を${timeframe}に変更しました`, {
              component: 'SocketService',
              action: 'emitTimeframeChange'
            });
            resolve(true);
          } else {
            logger.warn(`時間足${timeframe}への変更に失敗しました`, {
              component: 'SocketService',
              action: 'emitTimeframeChange'
            });
            resolve(false);
          }
        });
      });
    } catch (error) {
      logger.error('時間足変更エラー:', error, {
        component: 'SocketService',
        action: 'emitTimeframeChange',
        timeframe
      });
      return Promise.resolve(false);
    }
  }

  /**
   * 銘柄変更イベントを発行
   * @param symbol 変更する銘柄（例：BTCUSDT, ETHUSDT, SOLUSDT）
   * @returns 成功した場合はtrue、失敗した場合はfalse
   */
  emitSymbolChange(symbol: string): Promise<boolean> {
    try {
      const socket = getSocket(false);
      if (!socket) {
        // 自動初期化も失敗した場合
        logger.warn('ソケット接続がありません。銘柄変更イベントを発行できません。', {
          component: 'SocketService',
          action: 'emitSymbolChange',
          symbol
        });
        return Promise.resolve(false);
      }
      
      // 接続確認
      if (!socket.connected) {
        logger.warn('ソケットは初期化されていますが、接続されていません。', {
          component: 'SocketService',
          action: 'emitSymbolChange',
          symbol
        });
      }

      return new Promise((resolve) => {
        emitEvent('changeSymbol', { symbol }, (response: { success: boolean }) => {
          if (response && response.success) {
            logger.info(`銘柄を${symbol}に変更しました`, {
              component: 'SocketService',
              action: 'emitSymbolChange'
            });
            resolve(true);
          } else {
            logger.warn(`銘柄${symbol}への変更に失敗しました`, {
              component: 'SocketService',
              action: 'emitSymbolChange'
            });
            resolve(false);
          }
        });
      });
    } catch (error) {
      logger.error('銘柄変更エラー:', error, {
        component: 'SocketService',
        action: 'emitSymbolChange',
        symbol
      });
      return Promise.resolve(false);
    }
  }

  /**
   * 接続状態を取得
   * @returns 接続されている場合はtrue、そうでない場合はfalse
   */
  isConnected(): boolean {
    return this.client.isConnected();
  }

  /**
   * 再接続をスケジュール
   */
  scheduleReconnect(): void {
    this.client.scheduleReconnect();
  }

  /**
   * すべてのサブスクリプションを再購読
   */
  resubscribeAll(): void {
    this.subscriptionManager.resubscribeAll();
  }
}

// シングルトンインスタンス
let socketServiceInstance: SocketService | null = null;

/**
 * シングルトンSocketServiceインスタンスを取得
 * @returns SocketServiceインスタンス
 */
export function getSocketService(): SocketService {
  if (typeof window === 'undefined') {
    // サーバーサイドレンダリング時は新しいインスタンスを作成
    return new SocketService();
  }
  
  if (!socketServiceInstance) {
    socketServiceInstance = new SocketService();
    // 初期化
    socketServiceInstance.initializeMarketSocket();
  }
  
  return socketServiceInstance;
}

// 後方互換性のために socketService もエクスポート
export const socketService = typeof window !== 'undefined'
  ? getSocketService()
  : new SocketService(); // サーバーサイドレンダリング時は新しいインスタンスを作成
