/**
 * services/socket/socket-service.ts
 * 外部向けWebSocketサービスを提供
 * 
 * 作成: 2025-05-12 - WebSocketサービスのリファクタリングの一環として
 * 変更: index.tsから主要なサービス機能を分離
 */

import { Socket } from 'socket.io-client';
import { OrderBookData } from '../../types/market';
import { OHLCData, Timeframe } from '../../types/chart';
import { ExchangeType } from '../../types/api';
import { BitgetApiClient } from '../api/bitget/client';
import { logger } from '../../utils/logger';
import { 
  ISocketService, 
  IWebSocketClient, 
  ISubscriptionManager, 
  IBitgetIntegration 
} from './interfaces';

/**
 * WebSocketサービスクラス
 * Socket.IOとBitgetAPIを統合し、データ購読機能を提供
 */
export class SocketService implements ISocketService {
  private webSocketClient: IWebSocketClient;
  private subscriptionManager: ISubscriptionManager;
  private bitgetIntegration: IBitgetIntegration;

  /**
   * コンストラクタ
   * @param webSocketClient WebSocketクライアント
   * @param subscriptionManager サブスクリプションマネージャー
   * @param bitgetIntegration BitgetAPI統合
   */
  constructor(
    webSocketClient: IWebSocketClient,
    subscriptionManager: ISubscriptionManager,
    bitgetIntegration: IBitgetIntegration
  ) {
    this.webSocketClient = webSocketClient;
    this.subscriptionManager = subscriptionManager;
    this.bitgetIntegration = bitgetIntegration;
    
    logger.info('SocketServiceインスタンスを作成', {
      component: 'SocketService',
      action: 'constructor'
    });
  }

  /**
   * 接続状態を確認
   * @returns 接続されているかどうか
   */
  isConnected(): boolean {
    return this.webSocketClient.isConnected();
  }

  /**
   * マーケットデータ用のWebSocket接続を初期化
   * @returns Socket.IOのソケットインスタンス
   */
  initializeMarketSocket(): Socket | null {
    return this.webSocketClient.initialize();
  }

  /**
   * BitgetAPIクライアントを初期化
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @param config 追加の設定オプション
   * @returns BitgetAPIクライアントインスタンス
   */
  initializeApiClient(exchangeType: ExchangeType, config: Record<string, any> = {}): BitgetApiClient {
    return this.bitgetIntegration.initializeApiClient(exchangeType, config);
  }

  /**
   * 現在のBitgetAPIクライアントを取得
   * @returns 現在のBitgetAPIクライアントインスタンス
   */
  getCurrentApiClient(): BitgetApiClient | null {
    return this.bitgetIntegration.getCurrentApiClient();
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
   * @param timeframe 時間枠（例: '1m', '1h'）
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @returns 購読解除用の関数
   */
  subscribeKline(
    symbol: string,
    timeframe: Timeframe,
    callback: (data: OHLCData) => void,
    exchangeType: ExchangeType = 'spot'
  ): () => void {
    return this.subscriptionManager.subscribeKline(symbol, timeframe, callback, exchangeType);
  }

  /**
   * すべての接続を切断
   */
  disconnectAll(): void {
    try {
      // WebSocket接続を切断
      this.webSocketClient.disconnect();
      
      // BitgetAPIクライアントを切断
      this.bitgetIntegration.disconnectApiClient();
      
      logger.info('すべての接続を切断しました', {
        component: 'SocketService',
        action: 'disconnectAll'
      });
    } catch (error) {
      logger.error('接続切断エラー:', error, {
        component: 'SocketService',
        action: 'disconnectAll',
        error
      });
    }
  }

  /**
   * 再接続をスケジュール
   */
  scheduleReconnect(): void {
    this.webSocketClient.scheduleReconnect();
  }

  /**
   * すべての購読を再購読
   */
  resubscribeAll(): void {
    this.subscriptionManager.resubscribeAll();
  }
}
