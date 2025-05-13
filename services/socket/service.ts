/**
 * services/socket/service.ts
 * WebSocketサービスのシングルトンインスタンスを提供
 */

import { EventEmitter } from 'events';
import { OrderBookData } from '../../types/market';
import { OHLCData, Timeframe } from '../../types/chart';
import { ExchangeType } from '../../types/api';
import { logger } from '../../utils/logger';

/**
 * WebSocketサービスインターフェース
 */
export interface ISocketService {
  isConnected(): boolean;
  connect(): Promise<void>;
  disconnect(): void;
  subscribeOrderBook(
    symbol: string,
    callback: (data: OrderBookData) => void,
    exchangeType?: ExchangeType
  ): () => void;
  subscribeKline(
    symbol: string,
    timeframe: Timeframe,
    callback: (data: OHLCData) => void,
    exchangeType?: ExchangeType
  ): () => void;
}

/**
 * WebSocketサービスの実装
 */
class SocketService extends EventEmitter implements ISocketService {
  private connected: boolean = false;
  private mockInterval: NodeJS.Timeout | null = null;
  
  /**
   * 接続状態を確認
   */
  isConnected(): boolean {
    return this.connected;
  }
  
  /**
   * WebSocket接続を確立
   */
  async connect(): Promise<void> {
    if (this.connected) return;
    
    try {
      // 実際の接続処理は実装によって異なる
      // ここではモック実装
      this.connected = true;
      logger.info('WebSocketサービスが接続されました', {
        component: 'SocketService',
        action: 'connect'
      });
      
      // モックデータの配信を開始
      this.startMockDataBroadcast();
      
      this.emit('connected');
    } catch (error) {
      logger.error(`WebSocket接続エラー: ${error}`, {
        component: 'SocketService',
        action: 'connect',
        error
      });
      throw error;
    }
  }
  
  /**
   * WebSocket接続を切断
   */
  disconnect(): void {
    if (!this.connected) return;
    
    try {
      // 実際の切断処理は実装によって異なる
      this.connected = false;
      
      // モックデータの配信を停止
      this.stopMockDataBroadcast();
      
      logger.info('WebSocketサービスが切断されました', {
        component: 'SocketService',
        action: 'disconnect'
      });
      
      this.emit('disconnected');
    } catch (error) {
      logger.error(`WebSocket切断エラー: ${error}`, {
        component: 'SocketService',
        action: 'disconnect',
        error
      });
    }
  }
  
  /**
   * オーダーブックデータを購読
   */
  subscribeOrderBook(
    symbol: string,
    callback: (data: OrderBookData) => void,
    exchangeType: ExchangeType = 'spot'
  ): () => void {
    if (!this.connected) {
      logger.warn(`WebSocketが接続されていないため、オーダーブックの購読ができません: ${symbol}`, {
        component: 'SocketService',
        action: 'subscribeOrderBook',
        symbol,
        exchangeType
      });
      return () => {};
    }
    
    const handler = (data: OrderBookData) => {
      if (data.symbol === symbol) {
        callback(data);
      }
    };
    
    this.on('orderbook', handler);
    
    logger.info(`オーダーブックの購読を開始: ${symbol}`, {
      component: 'SocketService',
      action: 'subscribeOrderBook',
      symbol,
      exchangeType
    });
    
    return () => {
      this.off('orderbook', handler);
      logger.info(`オーダーブックの購読を解除: ${symbol}`, {
        component: 'SocketService',
        action: 'unsubscribeOrderBook',
        symbol,
        exchangeType
      });
    };
  }
  
  /**
   * ローソク足データを購読
   */
  subscribeKline(
    symbol: string,
    timeframe: Timeframe,
    callback: (data: OHLCData) => void,
    exchangeType: ExchangeType = 'spot'
  ): () => void {
    if (!this.connected) {
      logger.warn(`WebSocketが接続されていないため、ローソク足データの購読ができません: ${symbol} ${timeframe}`, {
        component: 'SocketService',
        action: 'subscribeKline',
        symbol,
        timeframe,
        exchangeType
      });
      return () => {};
    }
    
    const handler = (data: OHLCData & { symbol?: string; timeframe?: string }) => {
      if (data.symbol === symbol && data.timeframe === timeframe) {
        callback(data);
      }
    };
    
    this.on('kline', handler);
    
    logger.info(`ローソク足データの購読を開始: ${symbol} ${timeframe}`, {
      component: 'SocketService',
      action: 'subscribeKline',
      symbol,
      timeframe,
      exchangeType
    });
    
    return () => {
      this.off('kline', handler);
      logger.info(`ローソク足データの購読を解除: ${symbol} ${timeframe}`, {
        component: 'SocketService',
        action: 'unsubscribeKline',
        symbol,
        timeframe,
        exchangeType
      });
    };
  }
  
  /**
   * モックデータの配信を開始
   * 実際の実装では不要
   */
  private startMockDataBroadcast(): void {
    if (this.mockInterval) return;
    
    this.mockInterval = setInterval(() => {
      // モックのオーダーブックデータ
      const orderBookData: OrderBookData & { symbol: string } = {
        symbol: 'BTC/USDT',
        asks: [
          ['30000.00', '1.0'],
          ['30010.00', '2.0'],
          ['30020.00', '3.0']
        ],
        bids: [
          ['29990.00', '1.5'],
          ['29980.00', '2.5'],
          ['29970.00', '3.5']
        ],
        timestamp: Date.now()
      };
      
      // モックのローソク足データ
      const klineData: OHLCData & { symbol: string; timeframe: string } = {
        symbol: 'BTC/USDT',
        timeframe: '1m',
        time: Date.now(),
        open: 30000.00,
        high: 30100.00,
        low: 29900.00,
        close: 30050.00,
        volume: 100.00
      };
      
      this.emit('orderbook', orderBookData);
      this.emit('kline', klineData);
    }, 5000);
  }
  
  /**
   * モックデータの配信を停止
   * 実際の実装では不要
   */
  private stopMockDataBroadcast(): void {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }
}

// シングルトンインスタンス
let socketServiceInstance: SocketService | null = null;

/**
 * WebSocketサービスのシングルトンインスタンスを取得
 */
export function getSocketService(): ISocketService | null {
  if (!socketServiceInstance) {
    socketServiceInstance = new SocketService();
    
    // 自動接続
    socketServiceInstance.connect().catch(error => {
      logger.error(`WebSocketサービスの自動接続に失敗: ${error}`, {
        component: 'getSocketService',
        action: 'autoConnect',
        error
      });
    });
  }
  
  return socketServiceInstance;
}
