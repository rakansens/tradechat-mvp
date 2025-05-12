/**
 * services/bitget/websocket.ts
 * Bitget公式WebSocketエンドポイントを使用したクライアント
 * 
 * 作成: 2025-05-11 - Bitget公式WebSocketエンドポイントを使用した実装
 */

import { ExchangeType } from '@/types/api';
import { OrderBookData } from '@/types/market';
import { OHLCData, Timeframe } from '@/types/chart';
import { logger } from '@/utils/logger';

// Bitget WebSocketエンドポイント
const BITGET_WS_ENDPOINT = 'wss://ws.bitget.com/spot/v1/stream';
const BITGET_WS_FUTURES_ENDPOINT = 'wss://ws.bitget.com/mix/v1/stream';

// WebSocketの接続状態
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export class BitgetWebSocketClient {
  private ws: WebSocket | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private subscriptions: Map<string, any> = new Map();
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private exchangeType: ExchangeType = 'spot';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000;

  constructor(exchangeType: ExchangeType = 'spot') {
    this.exchangeType = exchangeType;
  }

  /**
   * WebSocket接続を初期化
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connectionState === 'connected') {
        resolve();
        return;
      }

      this.connectionState = 'connecting';

      // 接続先エンドポイントの選択
      const endpoint = this.exchangeType === 'spot' ? BITGET_WS_ENDPOINT : BITGET_WS_FUTURES_ENDPOINT;

      try {
        this.ws = new WebSocket(endpoint);

        // 接続オープン時の処理
        this.ws.onopen = () => {
          this.connectionState = 'connected';
          this.reconnectAttempts = 0;
          logger.info(`Bitget WebSocket接続成功: ${this.exchangeType}`, {
            component: 'BitgetWebSocketClient',
            action: 'connect',
            exchangeType: this.exchangeType
          });

          // 定期的なpingの送信を開始
          this.startPingInterval();

          // 既存のサブスクリプションを再購読
          this.resubscribe();

          resolve();
        };

        // メッセージ受信時の処理
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // pingレスポンスの処理
            if (data.action === 'pong') {
              return;
            }

            // エラーメッセージの処理
            if (data.code && data.code !== '0') {
              logger.error(`Bitget WebSocketエラー: ${data.msg || 'Unknown error'}`, {
                component: 'BitgetWebSocketClient',
                action: 'onmessage',
                data
              });
              return;
            }

            // データメッセージの処理
            if (data.action === 'push' && data.arg && data.data) {
              const channelKey = this.getChannelKey(data.arg);
              const handler = this.messageHandlers.get(channelKey);
              
              if (handler) {
                handler(data.data);
              }
            }
          } catch (error) {
            logger.error('WebSocketメッセージの解析エラー:', error, {
              component: 'BitgetWebSocketClient',
              action: 'onmessage',
              data: event.data
            });
          }
        };

        // エラー発生時の処理
        this.ws.onerror = (error) => {
          logger.error('Bitget WebSocketエラー:', error, {
            component: 'BitgetWebSocketClient',
            action: 'onerror',
            exchangeType: this.exchangeType
          });
          
          if (this.connectionState === 'connecting') {
            reject(error);
          }
        };

        // 接続切断時の処理
        this.ws.onclose = () => {
          logger.warn('Bitget WebSocket接続が切断されました', {
            component: 'BitgetWebSocketClient',
            action: 'onclose',
            exchangeType: this.exchangeType
          });
          
          this.stopPingInterval();
          
          if (this.connectionState !== 'disconnected') {
            this.connectionState = 'reconnecting';
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        this.connectionState = 'disconnected';
        logger.error('Bitget WebSocket接続の初期化エラー:', error, {
          component: 'BitgetWebSocketClient',
          action: 'connect',
          exchangeType: this.exchangeType
        });
        reject(error);
      }
    });
  }

  /**
   * WebSocket接続を切断
   */
  disconnect(): void {
    this.connectionState = 'disconnected';
    this.stopPingInterval();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      try {
        this.ws.close();
      } catch (error) {
        logger.error('WebSocket切断エラー:', error, {
          component: 'BitgetWebSocketClient',
          action: 'disconnect'
        });
      }
      this.ws = null;
    }
    
    this.subscriptions.clear();
    this.messageHandlers.clear();
  }

  /**
   * 定期的なpingの送信を開始
   */
  private startPingInterval(): void {
    this.stopPingInterval();
    
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          const pingMessage = JSON.stringify({ action: 'ping' });
          this.ws.send(pingMessage);
        } catch (error) {
          logger.error('Ping送信エラー:', error, {
            component: 'BitgetWebSocketClient',
            action: 'ping'
          });
        }
      }
    }, 20000); // 20秒ごとにping
  }

  /**
   * 定期的なpingの送信を停止
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * 再接続をスケジュール
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(`最大再接続試行回数(${this.maxReconnectAttempts})に達しました`, {
        component: 'BitgetWebSocketClient',
        action: 'scheduleReconnect'
      });
      this.connectionState = 'disconnected';
      return;
    }
    
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts);
    this.reconnectAttempts++;
    
    logger.info(`${delay}ms後に再接続を試みます (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, {
      component: 'BitgetWebSocketClient',
      action: 'scheduleReconnect'
    });
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect().catch(() => {
        // 再接続に失敗した場合は再度スケジュール
        this.scheduleReconnect();
      });
    }, delay);
  }

  /**
   * 既存のサブスクリプションを再購読
   */
  private resubscribe(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.subscriptions.forEach((subscription, channelKey) => {
        try {
          this.ws?.send(JSON.stringify(subscription));
          logger.info(`チャンネルを再購読: ${channelKey}`, {
            component: 'BitgetWebSocketClient',
            action: 'resubscribe',
            channelKey
          });
        } catch (error) {
          logger.error(`チャンネル再購読エラー: ${channelKey}`, error, {
            component: 'BitgetWebSocketClient',
            action: 'resubscribe'
          });
        }
      });
    }
  }

  /**
   * チャンネルキーを生成
   */
  private getChannelKey(arg: any): string {
    return `${arg.instType || ''}:${arg.channel || ''}:${arg.instId || ''}`;
  }

  /**
   * オーダーブックデータを購読
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param callback データ受信時のコールバック関数
   * @returns 購読解除用の関数
   */
  subscribeOrderBook(
    symbol: string,
    callback: (data: OrderBookData) => void
  ): () => void {
    // シンボルをBitget形式に変換
    const formattedSymbol = this.formatSymbol(symbol);
    
    // チャンネル情報の設定
    const instType = this.exchangeType === 'spot' ? 'sp' : 'mc';
    const channel = 'books';
    const channelKey = `${instType}:${channel}:${formattedSymbol}`;
    
    // 購読メッセージの作成
    const subscriptionMessage = {
      action: 'subscribe',
      arg: {
        instType,
        channel,
        instId: formattedSymbol
      }
    };
    
    // メッセージハンドラの登録
    this.messageHandlers.set(channelKey, (data: any) => {
      try {
        // データの変換
        const orderBookData: OrderBookData = {
          symbol,
          timestamp: Date.now(),
          asks: Array.isArray(data.asks) ? data.asks.map((ask: string[]) => ({
            price: parseFloat(ask[0]),
            amount: parseFloat(ask[1])
          })) : [],
          bids: Array.isArray(data.bids) ? data.bids.map((bid: string[]) => ({
            price: parseFloat(bid[0]),
            amount: parseFloat(bid[1])
          })) : []
        };
        
        // コールバック関数の呼び出し
        callback(orderBookData);
      } catch (error) {
        logger.error('オーダーブックデータ変換エラー:', error, {
          component: 'BitgetWebSocketClient',
          action: 'handleOrderBookData',
          symbol,
          data
        });
      }
    });
    
    // 購読の保存
    this.subscriptions.set(channelKey, subscriptionMessage);
    
    // WebSocketが接続されていない場合は接続
    if (this.connectionState !== 'connected') {
      this.connect().catch((error) => {
        logger.error('WebSocket接続エラー:', error, {
          component: 'BitgetWebSocketClient',
          action: 'subscribeOrderBook'
        });
      });
    } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // 接続済みの場合は購読メッセージを送信
      try {
        this.ws.send(JSON.stringify(subscriptionMessage));
        logger.info(`オーダーブックを購読: ${symbol}`, {
          component: 'BitgetWebSocketClient',
          action: 'subscribeOrderBook',
          symbol,
          exchangeType: this.exchangeType
        });
      } catch (error) {
        logger.error('購読メッセージ送信エラー:', error, {
          component: 'BitgetWebSocketClient',
          action: 'subscribeOrderBook',
          symbol
        });
      }
    }
    
    // 購読解除関数を返す
    return () => {
      try {
        // 購読解除メッセージの作成
        const unsubscribeMessage = {
          action: 'unsubscribe',
          arg: {
            instType,
            channel,
            instId: formattedSymbol
          }
        };
        
        // WebSocketが接続されている場合は購読解除メッセージを送信
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(unsubscribeMessage));
        }
        
        // 購読とハンドラを削除
        this.subscriptions.delete(channelKey);
        this.messageHandlers.delete(channelKey);
        
        logger.info(`オーダーブックの購読を解除: ${symbol}`, {
          component: 'BitgetWebSocketClient',
          action: 'unsubscribeOrderBook',
          symbol
        });
      } catch (error) {
        logger.error('購読解除エラー:', error, {
          component: 'BitgetWebSocketClient',
          action: 'unsubscribeOrderBook',
          symbol
        });
      }
    };
  }

  /**
   * チャートデータを購読
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param timeframe タイムフレーム（例: '1m', '1h'）
   * @param callback データ受信時のコールバック関数
   * @returns 購読解除用の関数
   */
  subscribeCandles(
    symbol: string,
    timeframe: Timeframe,
    callback: (data: OHLCData) => void
  ): () => void {
    // シンボルをBitget形式に変換
    const formattedSymbol = this.formatSymbol(symbol);
    
    // タイムフレームをBitget形式に変換
    const formattedTimeframe = this.formatTimeframe(timeframe);
    
    // チャンネル情報の設定
    const instType = this.exchangeType === 'spot' ? 'sp' : 'mc';
    const channel = `candle${formattedTimeframe}`;
    const channelKey = `${instType}:${channel}:${formattedSymbol}`;
    
    // 購読メッセージの作成
    const subscriptionMessage = {
      action: 'subscribe',
      arg: {
        instType,
        channel,
        instId: formattedSymbol
      }
    };
    
    // メッセージハンドラの登録
    this.messageHandlers.set(channelKey, (data: any) => {
      try {
        if (Array.isArray(data) && data.length > 0) {
          // Bitgetのキャンドルデータは配列形式
          // [timestamp, open, high, low, close, volume]
          const candle = data[0];
          
          // データの変換
          const ohlcData: OHLCData = {
            time: parseInt(candle[0]),
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
            volume: parseFloat(candle[5]),
            symbol,
            timeframe
          };
          
          // コールバック関数の呼び出し
          callback(ohlcData);
        }
      } catch (error) {
        logger.error('チャートデータ変換エラー:', error, {
          component: 'BitgetWebSocketClient',
          action: 'handleCandleData',
          symbol,
          timeframe,
          data
        });
      }
    });
    
    // 購読の保存
    this.subscriptions.set(channelKey, subscriptionMessage);
    
    // WebSocketが接続されていない場合は接続
    if (this.connectionState !== 'connected') {
      this.connect().catch((error) => {
        logger.error('WebSocket接続エラー:', error, {
          component: 'BitgetWebSocketClient',
          action: 'subscribeCandles'
        });
      });
    } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // 接続済みの場合は購読メッセージを送信
      try {
        this.ws.send(JSON.stringify(subscriptionMessage));
        logger.info(`チャートデータを購読: ${symbol} ${timeframe}`, {
          component: 'BitgetWebSocketClient',
          action: 'subscribeCandles',
          symbol,
          timeframe,
          exchangeType: this.exchangeType
        });
      } catch (error) {
        logger.error('購読メッセージ送信エラー:', error, {
          component: 'BitgetWebSocketClient',
          action: 'subscribeCandles',
          symbol,
          timeframe
        });
      }
    }
    
    // 購読解除関数を返す
    return () => {
      try {
        // 購読解除メッセージの作成
        const unsubscribeMessage = {
          action: 'unsubscribe',
          arg: {
            instType,
            channel,
            instId: formattedSymbol
          }
        };
        
        // WebSocketが接続されている場合は購読解除メッセージを送信
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(unsubscribeMessage));
        }
        
        // 購読とハンドラを削除
        this.subscriptions.delete(channelKey);
        this.messageHandlers.delete(channelKey);
        
        logger.info(`チャートデータの購読を解除: ${symbol} ${timeframe}`, {
          component: 'BitgetWebSocketClient',
          action: 'unsubscribeCandles',
          symbol,
          timeframe
        });
      } catch (error) {
        logger.error('購読解除エラー:', error, {
          component: 'BitgetWebSocketClient',
          action: 'unsubscribeCandles',
          symbol,
          timeframe
        });
      }
    };
  }

  /**
   * シンボルをBitget形式に変換
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @returns Bitget形式のシンボル（例: 'BTCUSDT'）
   */
  private formatSymbol(symbol: string): string {
    // スラッシュを削除
    const formattedSymbol = symbol.replace('/', '');
    
    // 先物取引の場合はサフィックスを追加
    if (this.exchangeType === 'futures') {
      return `${formattedSymbol}_UMCBL`;
    }
    
    return formattedSymbol;
  }

  /**
   * タイムフレームをBitget形式に変換
   * @param timeframe タイムフレーム（例: '1m', '1h'）
   * @returns Bitget形式のタイムフレーム
   */
  private formatTimeframe(timeframe: Timeframe): string {
    // Bitgetのタイムフレームマッピング
    const timeframeMap: Record<string, string> = {
      '1m': '1min',
      '3m': '3min',
      '5m': '5min',
      '15m': '15min',
      '30m': '30min',
      '1h': '1H',
      '2h': '2H',
      '4h': '4H',
      '6h': '6H',
      '8h': '8H',
      '12h': '12H',
      '1d': '1D',
      '3d': '3D',
      '1w': '1W',
      '1M': '1M'
    };
    
    return timeframeMap[timeframe] || '1min';
  }
}

// シングルトンインスタンス
let spotClientInstance: BitgetWebSocketClient | null = null;
let futuresClientInstance: BitgetWebSocketClient | null = null;

/**
 * BitgetWebSocketClientのインスタンスを取得
 * @param exchangeType 取引タイプ（'spot'または'futures'）
 * @returns BitgetWebSocketClientインスタンス
 */
export function getBitgetWebSocketClient(exchangeType: ExchangeType = 'spot'): BitgetWebSocketClient {
  if (exchangeType === 'spot') {
    if (!spotClientInstance) {
      spotClientInstance = new BitgetWebSocketClient('spot');
    }
    return spotClientInstance;
  } else {
    if (!futuresClientInstance) {
      futuresClientInstance = new BitgetWebSocketClient('futures');
    }
    return futuresClientInstance;
  }
}
