/**
 * services/ccxws/client.ts
 * CCXWSを使用した暗号通貨取引所WebSocketクライアント
 * 
 * 作成: 2025-05-11 - CCXWSライブラリを使用したWebSocketクライアントの実装
 */

import { BitgetClient } from 'ccxws';
import { ExchangeType } from '@/types/api';
import { OrderBookData } from '@/types/market';
import { OHLCData, Timeframe } from '@/types/chart';
import { logger } from '@/utils/logger';
import { normalizeSymbol } from '@/lib/utils';

// サポートする取引所のマッピング
const EXCHANGE_CLIENTS = {
  bitget: BitgetClient,
};

// 取引所タイプのマッピング
const EXCHANGE_TYPE_MAP = {
  spot: 'spot',
  futures: 'swap',
};

export class CCXWSClient {
  private clients: Record<string, any> = {};
  private subscriptions: Map<string, () => void> = new Map();
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * CCXWSクライアントの初期化
   */
  initialize(): void {
    try {
      // ブラウザ環境かどうかを確認
      if (typeof window === 'undefined') {
        logger.warn('CCXWSClientはブラウザ環境でのみ初期化できます', {
          component: 'CCXWSClient',
          action: 'initialize'
        });
        return;
      }

      // サポートする取引所のクライアントを初期化
      this.clients.bitget = new BitgetClient();

      // エラーハンドラの設定
      Object.values(this.clients).forEach(client => {
        client.on('error', this.handleError.bind(this));
      });

      this.isInitialized = true;
      logger.info('CCXWSクライアントが初期化されました', {
        component: 'CCXWSClient',
        action: 'initialize',
        exchanges: Object.keys(this.clients)
      });
    } catch (error) {
      logger.error('CCXWSクライアント初期化エラー:', error, {
        component: 'CCXWSClient',
        action: 'initialize'
      });
    }
  }

  /**
   * オーダーブックデータを購読
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @param exchange 取引所名（デフォルト: 'bitget'）
   * @returns 購読解除用の関数
   */
  subscribeOrderBook(
    symbol: string,
    callback: (data: OrderBookData) => void,
    exchangeType: ExchangeType = 'spot',
    exchange: string = 'bitget'
  ): () => void {
    try {
      if (!this.isInitialized) {
        this.initialize();
      }

      const client = this.clients[exchange];
      if (!client) {
        logger.error(`取引所 ${exchange} はサポートされていません`, {
          component: 'CCXWSClient',
          action: 'subscribeOrderBook',
          exchange
        });
        return () => {};
      }

      // シンボルを正規化
      const normalizedSymbol = normalizeSymbol(symbol);

      // CCXWSのマーケットフォーマットに変換
      const market = this.formatMarket(normalizedSymbol, exchangeType, exchange);

      // サブスクリプションキーの生成
      const subKey = `orderbook:${exchange}:${normalizedSymbol}:${exchangeType}`;

      // 既存のサブスクリプションがあれば解除
      if (this.subscriptions.has(subKey)) {
        this.subscriptions.get(subKey)?.();
        this.subscriptions.delete(subKey);
      }

      // オーダーブックスナップショットのイベントリスナー
      const handleSnapshot = (snapshot: any) => {
        try {
          // データの変換
          const orderBookData: OrderBookData = {
            symbol: normalizedSymbol,
            timestamp: snapshot.timestamp || Date.now(),
            asks: snapshot.asks.map((ask: any) => ({
              price: parseFloat(ask.price),
              amount: parseFloat(ask.size)
            })),
            bids: snapshot.bids.map((bid: any) => ({
              price: parseFloat(bid.price),
              amount: parseFloat(bid.size)
            }))
          };

          // コールバック関数の呼び出し
          callback(orderBookData);
        } catch (error) {
          logger.error(`オーダーブックデータ変換エラー:`, error, {
            component: 'CCXWSClient',
            action: 'handleSnapshot',
            symbol: normalizedSymbol,
            exchange,
            exchangeType
          });
        }
      };

      // オーダーブック更新のイベントリスナー
      const handleUpdate = (update: any) => {
        try {
          // データの変換
          const orderBookData: OrderBookData = {
            symbol: normalizedSymbol,
            timestamp: update.timestamp || Date.now(),
            asks: update.asks.map((ask: any) => ({
              price: parseFloat(ask.price),
              amount: parseFloat(ask.size)
            })),
            bids: update.bids.map((bid: any) => ({
              price: parseFloat(bid.price),
              amount: parseFloat(bid.size)
            }))
          };

          // コールバック関数の呼び出し
          callback(orderBookData);
        } catch (error) {
          logger.error(`オーダーブック更新データ変換エラー:`, error, {
            component: 'CCXWSClient',
            action: 'handleUpdate',
            symbol: normalizedSymbol,
            exchange,
            exchangeType
          });
        }
      };

      // イベントリスナーの登録
      client.on('l2snapshot', handleSnapshot);
      client.on('l2update', handleUpdate);

      // オーダーブックの購読開始
      client.subscribeLevel2Snapshots(market);
      client.subscribeLevel2Updates(market);

      logger.info(`オーダーブックを購読開始: ${normalizedSymbol}`, {
        component: 'CCXWSClient',
        action: 'subscribeOrderBook',
        symbol: normalizedSymbol,
        exchange,
        exchangeType,
        market
      });

      // 購読解除関数の作成
      const unsubscribe = () => {
        try {
          client.off('l2snapshot', handleSnapshot);
          client.off('l2update', handleUpdate);
          client.unsubscribeLevel2Snapshots(market);
          client.unsubscribeLevel2Updates(market);

          logger.info(`オーダーブックの購読を解除: ${normalizedSymbol}`, {
            component: 'CCXWSClient',
            action: 'unsubscribeOrderBook',
            symbol: normalizedSymbol,
            exchange,
            exchangeType
          });
        } catch (error) {
          logger.error(`オーダーブック購読解除エラー:`, error, {
            component: 'CCXWSClient',
            action: 'unsubscribeOrderBook',
            symbol: normalizedSymbol,
            exchange,
            exchangeType
          });
        }
      };

      // サブスクリプションを保存
      this.subscriptions.set(subKey, unsubscribe);

      return unsubscribe;
    } catch (error) {
      logger.error(`オーダーブック購読エラー: ${symbol}`, error, {
        component: 'CCXWSClient',
        action: 'subscribeOrderBook',
        symbol,
        exchange,
        exchangeType
      });
      return () => {};
    }
  }

  /**
   * トレードデータを購読
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @param exchange 取引所名（デフォルト: 'bitget'）
   * @returns 購読解除用の関数
   */
  subscribeTrades(
    symbol: string,
    callback: (trade: any) => void,
    exchangeType: ExchangeType = 'spot',
    exchange: string = 'bitget'
  ): () => void {
    try {
      if (!this.isInitialized) {
        this.initialize();
      }

      const client = this.clients[exchange];
      if (!client) {
        logger.error(`取引所 ${exchange} はサポートされていません`, {
          component: 'CCXWSClient',
          action: 'subscribeTrades',
          exchange
        });
        return () => {};
      }

      // シンボルを正規化
      const normalizedSymbol = normalizeSymbol(symbol);

      // CCXWSのマーケットフォーマットに変換
      const market = this.formatMarket(normalizedSymbol, exchangeType, exchange);

      // サブスクリプションキーの生成
      const subKey = `trades:${exchange}:${normalizedSymbol}:${exchangeType}`;

      // 既存のサブスクリプションがあれば解除
      if (this.subscriptions.has(subKey)) {
        this.subscriptions.get(subKey)?.();
        this.subscriptions.delete(subKey);
      }

      // トレードのイベントリスナー
      const handleTrade = (trade: any) => {
        try {
          // コールバック関数の呼び出し
          callback(trade);
        } catch (error) {
          logger.error(`トレードデータ変換エラー:`, error, {
            component: 'CCXWSClient',
            action: 'handleTrade',
            symbol: normalizedSymbol,
            exchange,
            exchangeType
          });
        }
      };

      // イベントリスナーの登録
      client.on('trade', handleTrade);

      // トレードの購読開始
      client.subscribeTrades(market);

      logger.info(`トレードを購読開始: ${normalizedSymbol}`, {
        component: 'CCXWSClient',
        action: 'subscribeTrades',
        symbol: normalizedSymbol,
        exchange,
        exchangeType,
        market
      });

      // 購読解除関数の作成
      const unsubscribe = () => {
        try {
          client.off('trade', handleTrade);
          client.unsubscribeTrades(market);

          logger.info(`トレードの購読を解除: ${normalizedSymbol}`, {
            component: 'CCXWSClient',
            action: 'unsubscribeTrades',
            symbol: normalizedSymbol,
            exchange,
            exchangeType
          });
        } catch (error) {
          logger.error(`トレード購読解除エラー:`, error, {
            component: 'CCXWSClient',
            action: 'unsubscribeTrades',
            symbol: normalizedSymbol,
            exchange,
            exchangeType
          });
        }
      };

      // サブスクリプションを保存
      this.subscriptions.set(subKey, unsubscribe);

      return unsubscribe;
    } catch (error) {
      logger.error(`トレード購読エラー: ${symbol}`, error, {
        component: 'CCXWSClient',
        action: 'subscribeTrades',
        symbol,
        exchange,
        exchangeType
      });
      return () => {};
    }
  }

  /**
   * ローソク足データを収集（トレードデータから構築）
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param timeframe タイムフレーム（例: '1m', '5m', '1h', '1d'）
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @param exchange 取引所名（デフォルト: 'bitget'）
   * @returns 購読解除用の関数
   */
  subscribeCandles(
    symbol: string,
    timeframe: Timeframe,
    callback: (candle: OHLCData) => void,
    exchangeType: ExchangeType = 'spot',
    exchange: string = 'bitget'
  ): () => void {
    // トレードデータを購読して、ローソク足データを構築
    // 注意: CCXWSは直接ローソク足データをサポートしていないため、
    // トレードデータから構築する必要があります
    
    // 現在のローソク足データを保持する変数
    let currentCandle: OHLCData | null = null;
    let lastTradeTime = 0;
    
    // タイムフレームをミリ秒に変換
    const timeframeMs = this.timeframeToMs(timeframe);
    
    // トレードデータのコールバック
    const handleTrade = (trade: any) => {
      const tradeTime = trade.timestamp;
      const tradePrice = parseFloat(trade.price);
      const tradeSize = parseFloat(trade.size);
      
      // 新しいローソク足の開始時間を計算
      const candleStartTime = Math.floor(tradeTime / timeframeMs) * timeframeMs;
      
      // 新しいローソク足を開始するか、既存のローソク足を更新
      if (!currentCandle || candleStartTime > lastTradeTime) {
        // 前のローソク足があれば、コールバックで返す
        if (currentCandle) {
          callback(currentCandle);
        }
        
        // 新しいローソク足を作成
        currentCandle = {
          time: candleStartTime,
          open: tradePrice,
          high: tradePrice,
          low: tradePrice,
          close: tradePrice,
          volume: tradeSize
        };
        
        lastTradeTime = candleStartTime;
      } else {
        // 既存のローソク足を更新
        if (currentCandle) {
          currentCandle.high = Math.max(currentCandle.high, tradePrice);
          currentCandle.low = Math.min(currentCandle.low, tradePrice);
          currentCandle.close = tradePrice;
          currentCandle.volume += tradeSize;
        }
      }
    };
    
    // トレードデータを購読
    return this.subscribeTrades(symbol, handleTrade, exchangeType, exchange);
  }

  /**
   * エラーハンドリング
   * @param err エラーオブジェクト
   */
  private handleError(err: Error): void {
    logger.error(`CCXWSエラー: ${err.message}`, {
      component: 'CCXWSClient',
      action: 'handleError',
      error: err
    });
  }

  /**
   * シンボルをCCXWSのマーケットフォーマットに変換
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @param exchange 取引所名
   * @returns CCXWSマーケットオブジェクト
   */
  private formatMarket(symbol: string, exchangeType: ExchangeType, exchange: string): any {
    // シンボルからベースとクォートを抽出
    let base, quote;
    
    if (symbol.includes('/')) {
      [base, quote] = symbol.split('/');
    } else if (symbol.includes('-')) {
      [base, quote] = symbol.split('-');
    } else {
      // BTC-USDTやBTCUSDTのような形式を処理
      // 一般的なクォート通貨
      const commonQuotes = ['USDT', 'USD', 'BTC', 'ETH', 'BUSD'];
      let found = false;
      
      for (const q of commonQuotes) {
        if (symbol.endsWith(q)) {
          base = symbol.substring(0, symbol.length - q.length);
          quote = q;
          found = true;
          break;
        }
      }
      
      if (!found) {
        // デフォルトの分割（最後の4文字をクォートとして扱う）
        base = symbol.slice(0, -4);
        quote = symbol.slice(-4);
      }
    }
    
    // CCXWSのマーケットフォーマットに変換
    return {
      id: symbol.replace('/', '').replace('-', ''), // 取引所固有のID
      base: base,
      quote: quote,
      type: EXCHANGE_TYPE_MAP[exchangeType] || 'spot'
    };
  }

  /**
   * タイムフレームをミリ秒に変換
   * @param timeframe タイムフレーム（例: '1m', '5m', '1h', '1d'）
   * @returns ミリ秒
   */
  private timeframeToMs(timeframe: Timeframe): number {
    const timeframeMap: Record<Timeframe, number> = {
      '1m': 60 * 1000,
      '3m': 3 * 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '2h': 2 * 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '8h': 8 * 60 * 60 * 1000,
      '12h': 12 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '3d': 3 * 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000,
      '1M': 30 * 24 * 60 * 60 * 1000
    };
    
    return timeframeMap[timeframe] || 60 * 1000; // デフォルトは1分
  }
}

// シングルトンインスタンス
let ccxwsClientInstance: CCXWSClient | null = null;

/**
 * CCXWSクライアントのシングルトンインスタンスを取得
 * @returns CCXWSClientインスタンス
 */
export function getCCXWSClient(): CCXWSClient {
  if (!ccxwsClientInstance) {
    ccxwsClientInstance = new CCXWSClient();
  }
  return ccxwsClientInstance;
}
