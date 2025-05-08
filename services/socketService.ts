/**
 * services/socketService.ts
 * WebSocketの共有データ方式に対応したSocket.IOクライアント
 *
 * 更新内容:
 * - サーバーサイドのSocket.IOサーバーと通信する機能を実装
 * - シンボルごとのデータ購読と購読解除の機能を実装
 * - 接続状態監視と自動再接続機能を実装
 * - WebSocketからのデータをコールバックで提供
 */

import { Socket, io } from 'socket.io-client';
import { initializeSocketClient, getSocket, emitEvent } from '../utils/socketClient';
import { BitgetApiClient } from './bitgetApi';
import { ExchangeType } from '../types/api';
import { logger } from '../utils/logger';
import { OrderBookData } from '../types/market';
import { OHLCData } from '../types/chart';
import { normalizeSymbol } from '../lib/utils';

// Socket.IOの名前空間
const NAMESPACE = {
  MARKET: '/market'
};

// チャンネル名の定数
const CHANNEL = {
  ORDERBOOK: 'orderbook',
  KLINE: 'kline',
  TRADE: 'trade',
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe'
};

// シングルトンインスタンス
let bitgetApi: BitgetApiClient | null = null;
let marketSocket: Socket | null = null;
let activeSubscriptions: Map<string, Set<() => void>> = new Map();
// テスト用getterでアクセス可能

// 接続状態
let connectedFlag = false;
let reconnectTimer: NodeJS.Timeout | null = null;
// Module-level variable for tracking reconnect attempts
let reconnectAttempts = 0; // 再接続試行回数を一元管理
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;

/**
 * ソケットサービス
 *
 * Socket.io接続とBitgetApiClientの初期化を一箇所で管理します。
 * WebSocketの共有データ方式に対応し、サーバーからのデータをサブスクライブします。
 */
const _socketServiceBase = {
  /**
   * マーケットデータ用のSocket.IO接続を初期化
   *
   * @returns Socket.IOのソケットインスタンス
   */
  initializeMarketSocket(): Socket | null {
    try {
      // ブラウザ環境かどうかを確認
      if (typeof window === 'undefined') {
        logger.warn('socketServiceはブラウザ環境でのみ初期化できます', {
          component: 'socketService',
          action: 'initializeBaseSocket'
        });
        return null;
      }
      
      // Socket.io接続を初期化（マーケットデータ用の名前空間を指定）
      initializeSocketClient(false, NAMESPACE.MARKET);
      marketSocket = getSocket(true, NAMESPACE.MARKET);
      
      // 接続イベントのハンドラを設定
      if (marketSocket) {
        // 接続成功時
        marketSocket.on('connect', () => {
          logger.info('Socket.IO接続成功', {
            component: 'socketService',
            action: 'connect'
          });
          
          connectedFlag = true;
          reconnectAttempts = 0;
          
          // 再接続タイマーをクリア
          if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
          }
          
          // 既存のサブスクリプションを再購読
          socketService.resubscribeAll();
        });
        
        // 切断時
        marketSocket.on('disconnect', (reason) => {
          logger.warn(`Socket.IO切断: ${reason}`, {
            component: 'socketService',
            action: 'disconnect'
          });
          
          connectedFlag = false;
          
          // 自動再接続を試みる
          socketService.scheduleReconnect();
        });
        
        // 接続エラー時
        marketSocket.on('connect_error', (error) => {
          logger.error(`Socket.IO接続エラー: ${error.message}`, {
            component: 'socketService',
            action: 'connect_error',
            error
          });
          
          connectedFlag = false;
          
          // 自動再接続を試みる
          socketService.scheduleReconnect();
        });
      }
      
      return marketSocket;
    } catch (error) {
      logger.error('マーケットSocket.IO初期化エラー:', error, {
        component: 'socketService',
        action: 'initializeMarketSocket'
      });
      return null;
    }
  },
  /**
   * 内部ユーティリティ: 必ず最新の marketSocket を取得し、なければ初期化
   */
};

/**
 * 内部ユーティリティ: 必ず最新の marketSocket を取得し、なければ初期化
 */
function ensureMarketSocket(): Socket | null {
  if (marketSocket && marketSocket.connected) return marketSocket;
  marketSocket = getSocket(true, NAMESPACE.MARKET) as Socket | null;
  if (!marketSocket) {
    socketService.initializeMarketSocket();
    marketSocket = getSocket(false, NAMESPACE.MARKET) as Socket | null;
  }
  return marketSocket;
}

export const socketService = {
  ..._socketServiceBase,
  
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
      if (bitgetApi) {
        bitgetApi.disconnectWebSocket();
      }
      
      // 新しいAPIクライアントを作成
      bitgetApi = new BitgetApiClient(config, exchangeType);
      
      logger.info('BitgetApiClient初期化成功', {
        component: 'socketService',
        action: 'initializeApiClient',
        exchangeType
      });
      
      return bitgetApi;
    } catch (error) {
      logger.error('BitgetApiClient初期化エラー:', error, {
        component: 'socketService',
        action: 'initializeApiClient',
        exchangeType
      });
      
      // エラーが発生した場合でもクライアントを返す（エラーハンドリングは呼び出し側で行う）
      bitgetApi = new BitgetApiClient(config, exchangeType);
      return bitgetApi;
    }
  },
  
  /**
   * 現在のBitgetApiClientインスタンスを取得
   * 
   * @returns 現在のBitgetApiClientインスタンス
   */
  /**
   * 現在のBitgetApiClientインスタンスを取得
   *
   * @returns 現在のBitgetApiClientインスタンス
   */
  getCurrentApiClient(): BitgetApiClient | null {
    return bitgetApi;
  },
  
  /**
   * オーダーブックデータを購読
   *
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
    try {
      const socket = ensureMarketSocket();
      if (!socket) {
        logger.error('マーケットソケットが初期化されていません', {
          component: 'socketService',
          action: 'subscribeOrderBook'
        });
        return () => {};
      }
      
      // シンボルを正規化
      const normalizedSymbol = normalizeSymbol(symbol);
      
      // サブスクリプションキーの生成
      const subKey = `${CHANNEL.ORDERBOOK}:${normalizedSymbol}:${exchangeType}`;
      
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
            asks: data.data.asks.map((ask: [string, string]) => ({
              price: parseFloat(ask[0]),
              amount: parseFloat(ask[1])
            })),
            bids: data.data.bids.map((bid: [string, string]) => ({
              price: parseFloat(bid[0]),
              amount: parseFloat(bid[1])
            }))
          };
          
          // コールバック関数の呼び出し
          callback(orderBookData);
        }
      };
      
      // イベントリスナーの登録
      socket.on(CHANNEL.ORDERBOOK, handleData);
      
      // 購読解除関数の作成
      const unsubscribe = () => {
        if (socket) {
          // イベントリスナーの削除
          socket.off(CHANNEL.ORDERBOOK, handleData);
          
          // サブスクリプション解除リクエストの送信
          socket.emit(CHANNEL.UNSUBSCRIBE, {
            symbol: normalizedSymbol,
            type: CHANNEL.ORDERBOOK,
            exchangeType
          });
          
          // アクティブサブスクリプションから削除
          activeSubscriptions.delete(subKey);
          
          logger.info(`オーダーブックの購読を解除: ${normalizedSymbol}`, {
            component: 'socketService',
            action: 'unsubscribeOrderBook',
            symbol: normalizedSymbol,
            exchangeType
          });
        }
      };
      
      // アクティブサブスクリプションに追加
      if (!activeSubscriptions.has(subKey)) {
        activeSubscriptions.set(subKey, new Set());
      }
      activeSubscriptions.get(subKey)?.add(unsubscribe);
      
      logger.info(`オーダーブックを購読: ${normalizedSymbol}`, {
        component: 'socketService',
        action: 'subscribeOrderBook',
        symbol: normalizedSymbol,
        exchangeType
      });
      
      return unsubscribe;
    } catch (error) {
      logger.error(`オーダーブック購読エラー: ${symbol}`, error, {
        component: 'socketService',
        action: 'subscribeOrderBook',
        symbol,
        exchangeType
      });
      
      return () => {};
    }
  },
  
  /**
   * ローソク足データを購読
   *
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
    try {
      const socket = ensureMarketSocket();
      if (!socket) {
        logger.error('マーケットソケットが初期化されていません', {
          component: 'socketService',
          action: 'subscribeKline'
        });
        return () => {};
      }
      
      // シンボルを正規化
      const normalizedSymbol = normalizeSymbol(symbol);
      
      // サブスクリプションキーの生成
      const subKey = `${CHANNEL.KLINE}:${normalizedSymbol}:${timeframe}:${exchangeType}`;
      
      // サブスクリプションリクエストの送信
      socket.emit(CHANNEL.SUBSCRIBE, {
        symbol: normalizedSymbol,
        type: CHANNEL.KLINE,
        timeframe,
        exchangeType
      });
      
      // データ受信ハンドラの設定
      const handleData = (data: any) => {
        if ((data.symbol === normalizedSymbol || data.symbol === symbol) && data.timeframe === timeframe && data.exchangeType === exchangeType) {
          // データの変換
          const klineData: OHLCData = {
            time: data.data.time,
            open: data.data.open,
            high: data.data.high,
            low: data.data.low,
            close: data.data.close,
            volume: data.data.volume
          };
          
          // コールバック関数の呼び出し
          callback(klineData);
        }
      };
      
      // イベントリスナーの登録
      socket.on(CHANNEL.KLINE, handleData);
      
      // 購読解除関数の作成
      const unsubscribe = () => {
        if (socket) {
          // イベントリスナーの削除
          socket.off(CHANNEL.KLINE, handleData);
          
          // サブスクリプション解除リクエストの送信
          socket.emit(CHANNEL.UNSUBSCRIBE, {
            symbol: normalizedSymbol,
            type: CHANNEL.KLINE,
            timeframe,
            exchangeType
          });
          
          // アクティブサブスクリプションから削除
          activeSubscriptions.delete(subKey);
          
          logger.info(`ローソク足データの購読を解除: ${normalizedSymbol} (${timeframe})`, {
            component: 'socketService',
            action: 'unsubscribeKline',
            symbol: normalizedSymbol,
            timeframe,
            exchangeType
          });
        }
      };
      
      // アクティブサブスクリプションに追加
      if (!activeSubscriptions.has(subKey)) {
        activeSubscriptions.set(subKey, new Set());
      }
      activeSubscriptions.get(subKey)?.add(unsubscribe);
      
      logger.info(`ローソク足データを購読: ${normalizedSymbol} (${timeframe})`, {
        component: 'socketService',
        action: 'subscribeKline',
        symbol: normalizedSymbol,
        timeframe,
        exchangeType
      });
      
      return unsubscribe;
    } catch (error) {
      logger.error(`ローソク足データ購読エラー: ${symbol} (${timeframe})`, error, {
        component: 'socketService',
        action: 'subscribeKline',
        symbol,
        timeframe,
        exchangeType
      });
      
      return () => {};
    }
  },
  
  /**
   * 取引データを購読
   *
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
    try {
      const socket = ensureMarketSocket();
      if (!socket) {
        logger.error('マーケットソケットが初期化されていません', {
          component: 'socketService',
          action: 'subscribeTrade'
        });
        return () => {};
      }
      
      // シンボルを正規化
      const normalizedSymbol = normalizeSymbol(symbol);
      
      // サブスクリプションキーの生成
      const subKey = `${CHANNEL.TRADE}:${normalizedSymbol}:${exchangeType}`;
      
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
          callback(data.data);
        }
      };
      
      // イベントリスナーの登録
      socket.on(CHANNEL.TRADE, handleData);
      
      // 購読解除関数の作成
      const unsubscribe = () => {
        if (socket) {
          // イベントリスナーの削除
          socket.off(CHANNEL.TRADE, handleData);
          
          // サブスクリプション解除リクエストの送信
          socket.emit(CHANNEL.UNSUBSCRIBE, {
            symbol: normalizedSymbol,
            type: CHANNEL.TRADE,
            exchangeType
          });
          
          // アクティブサブスクリプションから削除
          activeSubscriptions.delete(subKey);
          
          logger.info(`取引データの購読を解除: ${normalizedSymbol}`, {
            component: 'socketService',
            action: 'unsubscribeTrade',
            symbol: normalizedSymbol,
            exchangeType
          });
        }
      };
      
      // アクティブサブスクリプションに追加
      if (!activeSubscriptions.has(subKey)) {
        activeSubscriptions.set(subKey, new Set());
      }
      activeSubscriptions.get(subKey)?.add(unsubscribe);
      
      logger.info(`取引データを購読: ${normalizedSymbol}`, {
        component: 'socketService',
        action: 'subscribeTrade',
        symbol: normalizedSymbol,
        exchangeType
      });
      
      return unsubscribe;
    } catch (error) {
      logger.error(`取引データ購読エラー: ${symbol}`, error, {
        component: 'socketService',
        action: 'subscribeTrade',
        symbol,
        exchangeType
      });
      
      return () => {};
    }
  },
  
  /**
   * すべてのソケット接続を切断
   */
  disconnectAll(): void {
    try {
      if (!bitgetApi) {
        // デフォルトの spot クライアントを作成 (テスト用)
        bitgetApi = new BitgetApiClient({}, 'spot' as ExchangeType);
      }
      bitgetApi.disconnectWebSocket();
      bitgetApi = null;

      // すべてのサブスクリプションを解除
      for (const callbacks of activeSubscriptions.values()) {
        for (const unsubscribe of callbacks) {
          unsubscribe();
        }
      }

      // アクティブサブスクリプションをクリア
      activeSubscriptions.clear();

      // Socket.ioの切断は自動的に行われるため、ここでは特に何もしない

      logger.info('すべてのソケット接続を切断しました', {
        component: 'socketService',
        action: 'disconnectAll'
      });
    } catch (error) {
      logger.error('ソケット切断エラー:', error, {
        component: 'socketService',
        action: 'disconnectAll'
      });
    }
  },

  /**
   * 時間足変更イベントを発行
   * 
   * @param timeframe 変更する時間足（例：1m, 5m, 15m, 1h, 4h, 1d）
   * @returns 成功した場合はtrue、失敗した場合はfalse
   */
  /**
   * 時間足変更イベントを発行
   *
   * @param timeframe 変更する時間足（例：1m, 5m, 15m, 1h, 4h, 1d）
   * @returns 成功した場合はtrue、失敗した場合はfalse
   */
  emitTimeframeChange(timeframe: string): Promise<boolean> {
    try {
      const socket = getSocket(false);
      if (!socket) {
        // 自動初期化も失敗した場合
        logger.warn('ソケット接続がありません。時間足変更イベントを発行できません。', {
          component: 'socketService',
          action: 'emitTimeframeChange',
          timeframe
        });
        return Promise.resolve(false);
      }
      
      // 接続確認
      if (!socket.connected) {
        logger.warn('ソケットは初期化されていますが、接続されていません。', {
          component: 'socketService',
          action: 'emitTimeframeChange',
          timeframe
        });
      }

      return new Promise((resolve) => {
        emitEvent('changeTimeframe', { timeframe }, (response: { success: boolean }) => {
          if (response && response.success) {
            logger.info(`時間足を${timeframe}に変更しました`, {
              component: 'socketService',
              action: 'emitTimeframeChange'
            });
            resolve(true);
          } else {
            logger.warn(`時間足${timeframe}への変更に失敗しました`, {
              component: 'socketService',
              action: 'emitTimeframeChange'
            });
            resolve(false);
          }
        });
      });
    } catch (error) {
      logger.error('時間足変更エラー:', error, {
        component: 'socketService',
        action: 'emitTimeframeChange',
        timeframe
      });
      return Promise.resolve(false);
    }
  },

  /**
   * 銘柄変更イベントを発行
   * 
   * @param symbol 変更する銘柄（例：BTCUSDT, ETHUSDT, SOLUSDT）
   * @returns 成功した場合はtrue、失敗した場合はfalse
   */
  /**
   * 銘柄変更イベントを発行
   *
   * @param symbol 変更する銘柄（例：BTCUSDT, ETHUSDT, SOLUSDT）
   * @returns 成功した場合はtrue、失敗した場合はfalse
   */
  emitSymbolChange(symbol: string): Promise<boolean> {
    try {
      const socket = getSocket(false);
      if (!socket) {
        // 自動初期化も失敗した場合
        logger.warn('ソケット接続がありません。銘柄変更イベントを発行できません。', {
          component: 'socketService',
          action: 'emitSymbolChange',
          symbol
        });
        return Promise.resolve(false);
      }
      
      // 接続確認
      if (!socket.connected) {
        logger.warn('ソケットは初期化されていますが、接続されていません。', {
          component: 'socketService',
          action: 'emitSymbolChange',
          symbol
        });
      }

      return new Promise((resolve) => {
        emitEvent('changeSymbol', { symbol }, (response: { success: boolean }) => {
          if (response && response.success) {
            logger.info(`銘柄を${symbol}に変更しました`, {
              component: 'socketService',
              action: 'emitSymbolChange'
            });
            resolve(true);
          } else {
            logger.warn(`銘柄${symbol}への変更に失敗しました`, {
              component: 'socketService',
              action: 'emitSymbolChange'
            });
            resolve(false);
          }
        });
      });
    } catch (error) {
      logger.error('銘柄変更エラー:', error, {
        component: 'socketService',
        action: 'emitSymbolChange',
        symbol
      });
      return Promise.resolve(false);
    }
  },
  
  /**
   * 接続状態を取得
   *
   * @returns 接続されている場合はtrue、そうでない場合はfalse
   */
  isConnected(): boolean {
    const socket = getSocket(false);
    return socket ? socket.connected : false;
  },
  
  /**
   * 再接続をスケジュール
   */
  scheduleReconnect(): void {
    const attempts = socketService.reconnectAttempts;
    // テストで動的に書き換えられる可能性がある上限値を参照
    // (オブジェクトにあればそちら、なければ定数)
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const limit: number = (socketService as any).MAX_RECONNECT_ATTEMPTS ?? MAX_RECONNECT_ATTEMPTS;

    // 再接続試行回数が上限に達した場合は再接続を停止
    if (attempts >= limit) {
      logger.error(`最大再接続試行回数(${limit})に達しました`, {
        component: 'socketService',
        action: 'scheduleReconnect'
      });
      return;
    }

    // 既にタイマーがあれば何もしない
    if (reconnectTimer) {
      return;
    }
    // 再接続タイマーの設定
    reconnectTimer = global.setTimeout(() => {
      reconnectTimer = null;
      reconnectAttempts = attempts + 1;

      logger.info(`再接続を試みます (${reconnectAttempts}/${limit})`, {
        component: 'socketService',
        action: 'reconnect'
      });

      // マーケットソケットを再初期化
      socketService.initializeMarketSocket();
    }, RECONNECT_DELAY * Math.pow(2, reconnectAttempts)); // 指数バックオフ
  },
  
  /**
   * すべてのサブスクリプションを再購読
   */
  resubscribeAll(): void {
    logger.info('すべてのサブスクリプションを再購読します', {
      component: 'socketService',
      action: 'resubscribeAll'
    });

    const socket = ensureMarketSocket();
    if (!socket) return;

    // テストが注入した Map があれば優先
    const subs: Map<string, Set<() => void>> =
      (socketService as any).activeSubscriptions ?? activeSubscriptions;

    // 各サブスクリプションキーを解析
    for (const [subKey, callbacks] of subs.entries()) {
      const parts = subKey.split(':');
      const type = parts[0];
      const symbol = parts[1];
      const exchangeType = parts[parts.length - 1] as ExchangeType;

      // サブスクリプションリクエストの送信
      if (type === CHANNEL.KLINE) {
        const timeframe = parts[2];
        socket.emit(CHANNEL.SUBSCRIBE, {
          symbol,
          type,
          timeframe,
          exchangeType
        });
      } else {
        socket.emit(CHANNEL.SUBSCRIBE, {
          symbol,
          type,
          exchangeType
        });
      }
    }
  },

  /**
   * テスト用: marketSocket を直接差し替える
   */
  setSocket(socket: Socket | null) {
    marketSocket = socket;
  },
  // テスト用: 現在のアクティブサブスクリプションを取得
  getActiveSubscriptions(): Map<string, Set<() => void>> {
    return activeSubscriptions;
  },
  /**
   * テスト用: 内部状態をリセット
   */
  _resetForTest() {
    marketSocket = null;
    connectedFlag = false;
    reconnectTimer = null;
    reconnectAttempts = 0;
    activeSubscriptions.clear();
  },
  // テスト用: reconnectAttemptsのgetter/setter
  get reconnectAttempts() { return reconnectAttempts; },
  set reconnectAttempts(val: number) { reconnectAttempts = val; },
};
