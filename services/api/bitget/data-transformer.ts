/**
 * services/api/bitget/data-transformer.ts
 * Bitget APIのデータ変換クラス
 * 
 * 作成: 2025-05-12 - BitgetApiClientのリファクタリング
 * 
 * このファイルは、APIレスポンスの正規化とWebSocketメッセージのパースを担当します。
 */

import { ExchangeType } from '../../../types/api';
import { OHLCData, Timeframe } from '../../../types/chart';
import { OrderBookData } from '../../../types/market';
import { logger } from '@/utils/logger';
import { IS_DEV } from '../common/environment';

/**
 * BitgetDataTransformerクラス
 * APIレスポンスの正規化とWebSocketメッセージのパースを担当
 */
export class BitgetDataTransformer {
  /**
   * コンストラクタ
   */
  constructor() {
    logger.info('BitgetDataTransformer initialized', {
      component: 'BitgetDataTransformer',
      action: 'constructor'
    });
  }

  /**
   * ローソク足データを正規化
   * @param responseData APIレスポンスデータ
   * @returns 正規化されたローソク足データ
   */
  normalizeCandles(responseData: any[]): OHLCData[] {
    if (!responseData || !Array.isArray(responseData)) {
      throw new Error('Invalid candle data format');
    }

    // キャンドルデータを正規化して返す
    const processedData = responseData
      .map((candle: any) => {
        try {
          let result;
          // Bitget V2 APIのレスポンス形式に合わせて処理
          // [タイムスタンプ, 始値, 高値, 安値, 終値, 出来高, 出来安]
          if (Array.isArray(candle)) {
            // 必要なデータが存在するか確認
            if (!candle[0] || !candle[1] || !candle[2] || !candle[3] || !candle[4]) {
              if (IS_DEV) logger.warn('Skipping invalid candle array data', {
                component: 'BitgetDataTransformer',
                action: 'normalizeCandles',
                candle
              });
              return null;
            }
            
            const timestamp = parseInt(String(candle[0]));
            if (isNaN(timestamp) || timestamp <= 0) {
              if (IS_DEV) logger.warn('Invalid timestamp in candle array data', {
                component: 'BitgetDataTransformer',
                action: 'normalizeCandles',
                timestamp: candle[0]
              });
              return null;
            }
            
            result = {
              time: timestamp,
              open: parseFloat(String(candle[1])),
              high: parseFloat(String(candle[2])),
              low: parseFloat(String(candle[3])),
              close: parseFloat(String(candle[4])),
              volume: parseFloat(String(candle[5] || '0'))
            };
            
            // 変換後の配列データをログ出力
            if (IS_DEV) console.log('配列形式の変換後ローソク足データ:', result);
          } else if (typeof candle === 'object' && candle !== null) {
            // オブジェクト形式の場合
            if (!candle.timestamp && !candle.time) {
              if (IS_DEV) logger.warn('Skipping candle without timestamp', {
                component: 'BitgetDataTransformer',
                action: 'normalizeCandles',
                candle
              });
              return null;
            }
            
            // タイムスタンプを解析
            const timestamp = parseInt(String(candle.timestamp || candle.time));
            if (isNaN(timestamp) || timestamp <= 0) {
              if (IS_DEV) logger.warn('Invalid timestamp in candle object data', {
                component: 'BitgetDataTransformer',
                action: 'normalizeCandles',
                timestamp: candle.timestamp || candle.time
              });
              return null;
            }
            
            // デバッグ情報
            if (IS_DEV) console.log('オブジェクト形式のローソク足データ:', {
              timestamp,
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close,
              volume: candle.volume || candle.vol || '0'
            });
            
            result = {
              time: timestamp, // lightweight-chartsの要件に合わせてtimeとして設定
              open: parseFloat(String(candle.open)),
              high: parseFloat(String(candle.high)),
              low: parseFloat(String(candle.low)),
              close: parseFloat(String(candle.close)),
              volume: parseFloat(String(candle.volume || candle.vol || '0'))
            };
            
            // 変換後のオブジェクトデータをログ出力
            if (IS_DEV) console.log('オブジェクト形式の変換後ローソク足データ:', result);
          }
          
          // 全ての値が有効か確認
          if (isNaN(result.open) || isNaN(result.high) || isNaN(result.low) || isNaN(result.close)) {
            if (IS_DEV) console.warn('Skipping candle with NaN values:', result);
            return null;
          }
          
          return result;
        } catch (err) {
          if (IS_DEV) console.error('Error processing candle data:', err, candle);
          return null;
        }
      })
      .filter((candle: any): candle is OHLCData => candle !== null) // nullを除外
      .sort((a: OHLCData, b: OHLCData) => a.time - b.time); // 時間順にソート
    
    return processedData;
  }

  /**
   * オーダーブックデータを正規化
   * @param orderBookData APIレスポンスデータ
   * @param symbol シンボル
   * @returns 正規化されたオーダーブックデータ
   */
  normalizeOrderBook(orderBookData: any, symbol: string): OrderBookData {
    if (!orderBookData) {
      throw new Error('Empty OrderBook API response');
    }
    
    // asksとbidsが存在するか確認
    // 様々なプロパティ名に対応
    const asks = orderBookData.asks || orderBookData.askList || orderBookData.sellOrders || [];
    const bids = orderBookData.bids || orderBookData.bidList || orderBookData.buyOrders || [];
    
    if (!asks.length || !bids.length) {
      throw new Error('Invalid orderbook data format');
    }
    
    // OrderBookDataに変換
    return {
      symbol: symbol,
      asks,
      bids,
      timestamp: Date.now()
    };
  }

  /**
   * WebSocketメッセージからローソク足データを抽出
   * @param data 受信データ
   * @param instId 銘柄ID
   * @param channel チャンネル
   * @returns ローソク足データ
   */
  extractCandleFromWsMessage(data: any[], instId: string, channel: string): OHLCData | null {
    if (!data.length) return null;
    
    try {
      // データを変換
      const candle = data[0]; // 最新のローソク足
      if (!candle || candle.length < 6) {
        logger.warn('Invalid candle data', {
          component: 'BitgetDataTransformer',
          action: 'extractCandleFromWsMessage',
          candle
        });
        return null;
      }
      
      // OHLCData形式に変換
      return {
        time: parseInt(candle[0]),
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
        volume: parseFloat(candle[5])
      };
    } catch (error) {
      logger.error('Error extracting candle data', error, {
        component: 'BitgetDataTransformer',
        action: 'extractCandleFromWsMessage',
        data
      });
      return null;
    }
  }

  /**
   * WebSocketメッセージからオーダーブックデータを抽出
   * @param data 受信データ
   * @param instId 銘柄ID
   * @returns オーダーブックデータ
   */
  extractOrderBookFromWsMessage(data: any[], instId: string): OrderBookData | null {
    if (!data.length) return null;
    
    try {
      // シンボルを正規化
      const symbol = this.normalizeSymbol(instId);
      
      // オーダーブックデータを取得
      const orderBookData = data[0];
      if (!orderBookData || !orderBookData.asks || !orderBookData.bids) {
        logger.warn('Invalid order book data', {
          component: 'BitgetDataTransformer',
          action: 'extractOrderBookFromWsMessage',
          orderBookData
        });
        return null;
      }
      
      // OrderBookData形式に変換
      return {
        symbol: symbol.includes('/') ? symbol : `${symbol.slice(0, -4)}/${symbol.slice(-4)}`,
        asks: orderBookData.asks || [],
        bids: orderBookData.bids || [],
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Error extracting order book data', error, {
        component: 'BitgetDataTransformer',
        action: 'extractOrderBookFromWsMessage',
        data
      });
      return null;
    }
  }

  /**
   * BitgetのタイムフレームをStandard形式に変換
   * @param bitgetTimeframe Bitgetのタイムフレーム形式
   * @returns 標準タイムフレーム形式
   */
  convertBitgetTimeframeToStandard(bitgetTimeframe: string): string {
    const mapping: Record<string, string> = {
      '1min': '1m',
      '3min': '3m',
      '5min': '5m',
      '15min': '15m',
      '30min': '30m',
      '1H': '1h',
      '4H': '4h',
      '6H': '6h',
      '12H': '12h',
      '1D': '1d',
      '3D': '3d',
      '1W': '1w',
      '1M': '1M'
    };
    
    return mapping[bitgetTimeframe] || bitgetTimeframe;
  }

  /**
   * 標準タイムフレームをBitget形式に変換
   * @param timeframe 標準タイムフレーム形式
   * @returns Bitgetのタイムフレーム形式
   */
  convertTimeframeToBitgetV2Format(timeframe: string): string {
    const mapping: Record<string, string> = {
      '1m': '1min',      // 1分足
      '3m': '3min',      // 3分足
      '5m': '5min',      // 5分足
      '15m': '15min',    // 15分足
      '30m': '30min',    // 30分足
      '1h': '1H',        // 1時間足
      '4h': '4H',        // 4時間足
      '6h': '6H',        // 6時間足
      '12h': '12H',      // 12時間足
      '1d': '1D',        // 日足
      '3d': '3D',        // 3日足
      '1w': '1W',        // 週足
      '1M': '1M'         // 月足
    };
    
    return mapping[timeframe] || '1D'; // デフォルトは日足
  }

  /**
   * シンボルを正規化
   * @param instId 銘柄ID
   * @returns 正規化されたシンボル
   */
  normalizeSymbol(instId: string): string {
    // _UMCBLサフィックスを削除
    return instId.replace(/_UMCBL$/i, '');
  }
}
