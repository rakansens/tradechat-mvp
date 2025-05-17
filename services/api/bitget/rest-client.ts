/**
 * services/api/bitget/rest-client.ts
 * BitgetのREST APIクライアント実装
 * 
 * 作成: 2025-05-12 - SRPに基づいたBitget REST APIクライアントの実装
 * 更新: 2025-05-13 - パラメータ形式を修正し、異なるAPIエンドポイントを正しくハンドリング
 * 更新: 2025-05-13 - シンボル名からダブルクォートを削除するように修正
 * 
 * このファイルは、IRestApiClientインターフェースに準拠したBitgetのREST APIクライアントを実装します。
 * 単一責任の原則（SRP）に基づき、HTTP APIを使用した過去データの取得のみに責任を持ちます。
 */

import axios, { AxiosError } from 'axios';
import { ExchangeType, ExchangeProductType } from '@/types/api';
import { OHLCData, Timeframe, OrderBookData } from '@/types/chart';
import { IRestApiClient } from '../interfaces';
import { logger } from '../../../utils/logger';
import { safeExchangeType, safeProductType } from '../../../utils/exchangeTypeUtils';

/* --- ① symbol を API 仕様に合わせて正規化 --- */
const normalizeSymbol = (raw: string) => {
  // シンボル名に含まれるダブルクォートを削除
  let cleaned = raw.replace(/"/g, '');
  // スラッシュを削除して大文字に変換
  return cleaned.replace('/', '').toUpperCase();
};

/* --- ② Futures 用 productType を正式名に --- */
const FUTURES_PRODUCT_TYPES = {
  USDT: 'usdt-futures',
  COIN: 'coin-futures',
  USDC: 'usdc-futures',
};

/* --- ③ granularity をエンドポイント別に変換 --- */
const TIMEFRAME_MAP_SPOT: Record<string, string> = {
  // minute
  '1m': '1min', '3m': '3min', '5m': '5min', '15m': '15min', '30m': '30min',
  // hour
  '1h': '1h', '4h': '4h', '6h': '6h', '12h': '12h',
  // day / week / month
  '1d': '1day', '3d': '3day', '1w': '1week', '1M': '1M',
};

const TIMEFRAME_MAP_FUTURES: Record<string, string> = { 
  // minute
  '1m': '1m', '3m': '3m', '5m': '5m', '15m': '15m', '30m': '30m',
  // hour (uppercase as required by API)
  '1h': '1H', '4h': '4H', '6h': '6H', '12h': '12H',
  // day / week / month
  '1d': '1D', '3d': '3D', '1w': '1W', '1M': '1M',
};

// 時間足のマッピング関数
const toGranularity = (tf: string, ex: ExchangeType | ExchangeProductType): string => {
  // ExchangeProductTypeの場合はマッピングを行う
  const isFutures = ex === 'futures' || safeExchangeType(ex) === 'bitget';
  const map = isFutures ? TIMEFRAME_MAP_FUTURES : TIMEFRAME_MAP_SPOT;
  return map[tf] || tf;
};

/**
 * BitgetのREST APIクライアント実装
 */
export class BitgetRestClient implements IRestApiClient {
  private readonly baseUrl = 'https://api.bitget.com';

  /**
   * オーダーブックデータを取得（インターフェース互換性用）
   * @param symbol シンボル
   * @param exchangeType 取引タイプまたは取引種別
   * @returns オーダーブックデータ
   */
  public async getOrderBook(symbol: string, exchangeType: ExchangeType | ExchangeProductType): Promise<OrderBookData> {
    return this.fetchOrderBook(symbol, 100, exchangeType);
  }

  /**
   * 過去のローソク足データを取得（インターフェース互換性用）
   * @param symbol シンボル
   * @param timeframe タイムフレーム
   * @param limit 取得件数
   * @returns ローソク足データの配列
   */
  public async getHistoricalCandles(
    symbol: string,
    timeframe: Timeframe,
    limit: number = 100
  ): Promise<OHLCData[]> {
    return this.fetchCandles(symbol, timeframe, limit);
  }

  /**
   * 過去のローソク足データを取得
   * @param symbol シンボル
   * @param timeframe タイムフレーム
   * @param limit 取得件数
   * @param exchangeType 取引タイプまたは取引種別
   * @param endTime 終了時間（オプション）
   * @returns ローソク足データの配列
   */
  public async fetchCandles(
    symbol: string,
    timeframe: string,
    limit: number = 100,
    exchangeType: ExchangeType | ExchangeProductType = 'bitget',
    endTime?: number
  ): Promise<OHLCData[]> {
    try {
      let endpoint = '';
      const params: Record<string, any> = {
        limit: limit.toString()
      };
      
      // ① シンボルの正規化
      const normalizedSymbol = normalizeSymbol(symbol);
      params.symbol = normalizedSymbol;
      
      // ③ 時間足の変換
      const granularity = toGranularity(timeframe, exchangeType);
      params.granularity = granularity;
      
      // エンドポイントとパラメータ設定
      // exchangeTypeがExchangeProductTypeやエイリアスの場合も対応
      if (safeProductType(exchangeType) === 'futures') {
        endpoint = '/api/v2/mix/market/candles';
        // ② 正しい productType を設定
        params.productType = FUTURES_PRODUCT_TYPES.USDT;
      } else {
        endpoint = '/api/v2/spot/market/candles';
      }
      
      // endTimeが指定されていれば追加
      if (endTime !== undefined && endTime !== null) {
        params.endTime = endTime.toString();
      }
      
      // エンドポイントとパラメータをデバッグ用にログ出力
      logger.debug('Bitget APIリクエスト', {
        endpoint,
        params,
        exchangeType,
        timeframe,
        granularity,
        component: 'BitgetRestClient',
        action: 'fetchCandles'
      });
      
      const url = `${this.baseUrl}${endpoint}`;
      const response = await axios.get(url, { params });
      
      // レスポンスをログ出力（開発中のみ）
      // logger.debug('Bitget API response', { data: response.data });
      
      if (response.data && response.data.code === '00000') {
        const candlesData = response.data.data;
        return this.parseCandlesData(candlesData);
      } else {
        logger.error('APIエラーレスポンス: ', { error: response.data });
        throw new Error(JSON.stringify(response.data));
      }
    } catch (error) {
      logger.error('[BitgetRestClient:fetchCandles] 過去のローソク足データの取得に失敗しました: ', { error });
      throw error;
    }
  }

  /**
   * ローソク足データのパース
   * @param candlesData APIから返されたローソク足データ
   * @returns パース済みのOHLCData配列
   */
  private parseCandlesData(candlesData: any[]): OHLCData[] {
    if (!Array.isArray(candlesData)) {
      logger.warn('Bitgetから無効なローソク足データが返されました', { data: candlesData });
      return [];
    }

    return candlesData
      .filter(candle => Array.isArray(candle) && candle.length >= 6)
      .map(candle => {
        const [timestamp, open, high, low, close, volume] = candle;
        return {
          time: Number(timestamp),
          open: parseFloat(open),
          high: parseFloat(high),
          low: parseFloat(low),
          close: parseFloat(close),
          volume: parseFloat(volume)
        };
      })
      .sort((a, b) => a.time - b.time); // 時間順にソート
  }

  /**
   * オーダーブックの取得
   * @param symbol シンボル
   * @param depth 深度
   * @param exchangeType 取引タイプ
   * @returns オーダーブックデータ
   */
  public async fetchOrderBook(
    symbol: string,
    depth: number = 100,
    exchangeType: ExchangeType | ExchangeProductType = 'bitget'
  ): Promise<OrderBookData> {
    try {
      let endpoint = '';
      const params: Record<string, any> = {
        limit: depth.toString()
      };

      // ① シンボルの正規化
      const normalizedSymbol = normalizeSymbol(symbol);
      params.symbol = normalizedSymbol;

      // エンドポイント設定
      // ExchangeProductTypeとExchangeTypeの両方をサポート
      if (safeProductType(exchangeType) === 'futures') {
        endpoint = '/api/v2/mix/market/orderbook';
        // ② 正しい productType を設定
        params.productType = FUTURES_PRODUCT_TYPES.USDT;
      } else {
        endpoint = '/api/v2/spot/market/orderbook';
      }

      const url = `${this.baseUrl}${endpoint}`;
      const response = await axios.get(url, { params });

      if (response.data && response.data.code === '00000') {
        return this.parseOrderBookData(response.data.data, normalizedSymbol);
      } else {
        logger.error('APIエラーレスポンス: ', { error: response.data });
        throw new Error(JSON.stringify(response.data));
      }
    } catch (error) {
      logger.error('[BitgetRestClient:fetchOrderBook] オーダーブックの取得に失敗しました: ', { error });
      throw error;
    }
  }

  /**
   * オーダーブックデータのパース
   * @param orderBookData APIから返されたオーダーブックデータ
   * @param symbol シンボル
   * @returns パース済みのOrderBookData
   */
  private parseOrderBookData(orderBookData: any, symbol: string): OrderBookData {
    const { asks, bids, timestamp, ts, time } = orderBookData;
    const parsedTimestamp = Number(timestamp ?? ts ?? time ?? Date.now());
    return {
      symbol,
      asks: Array.isArray(asks) ? asks.map(([price, amount]) => ({ price: parseFloat(price), amount: parseFloat(amount) })) : [],
      bids: Array.isArray(bids) ? bids.map(([price, amount]) => ({ price: parseFloat(price), amount: parseFloat(amount) })) : [],
      timestamp: parsedTimestamp,
    };
  }
}
