/**
 * services/api/bitget/rest-client.ts
 * BitgetのREST APIクライアント実装
 * 
 * 作成: 2025-05-12 - SRPに基づいたBitget REST APIクライアントの実装
 * 
 * このファイルは、IRestApiClientインターフェースに準拠したBitgetのREST APIクライアントを実装します。
 * 単一責任の原則（SRP）に基づき、HTTP APIを使用した過去データの取得のみに責任を持ちます。
 */

import axios, { AxiosError } from 'axios';
import { ExchangeType } from '../../../types/api';
import { OHLCData, Timeframe, OrderBookData } from '../../../types/chart';
import { IRestApiClient } from '../interfaces';
import { logger } from '../../../utils/logger';

// Bitget REST APIのエンドポイント
const BITGET_REST_ENDPOINT = 'https://api.bitget.com';

// REST APIのタイムフレームマッピング
// Spot API と Futures API でフォーマットが異なるため分離
const TIMEFRAME_MAP_SPOT: Record<string, string> = {
  '1m': '1min', 
  '3m': '3min', 
  '5m': '5min', 
  '15m': '15min', 
  '30m': '30min',
  '1h': '1h',   
  '4h': '4h',   
  '6h': '6h',   
  '12h': '12h',
  '1d': '1day', 
  '3d': '3day', 
  '1w': '1week', 
  '1M': '1M'
};

const TIMEFRAME_MAP_FUTURES: Record<string, string> = {
  // futuresは基本が大文字
  '1m': '1min', 
  '3m': '3min', 
  '5m': '5min', 
  '15m': '15min', 
  '30m': '30min',
  '1h': '1H', 
  '4h': '4H', 
  '6h': '6H', 
  '12h': '12H',
  '1d': '1D', 
  '3d': '3D', 
  '1w': '1W', 
  '1M': '1M'
};

// 既存のマッピングを更新
const REST_TIMEFRAME_MAP: { [key: string]: string } = {
  ...TIMEFRAME_MAP_SPOT
};

/**
 * BitgetのREST APIクライアント
 * IRestApiClientインターフェースを実装
 */
export class BitgetRestClient implements IRestApiClient {
  /**
   * オーダーブックデータを取得
   * @param symbol シンボル
   * @param limit 取得件数
   * @param exchangeType 取引タイプ
   * @returns オーダーブックデータ
   */
  /**
   * オーダーブックデータを取得（インターフェース互換性用）
   * @param symbol シンボル
   * @param exchangeType 取引タイプ
   * @returns オーダーブックデータ
   */
  public async getOrderBook(symbol: string, exchangeType: ExchangeType): Promise<OrderBookData> {
    return this.fetchOrderBook(symbol, 100, exchangeType);
  }
  
  /**
   * オーダーブックデータを取得
   * @param symbol シンボル
   * @param limit 取得件数
   * @param exchangeType 取引タイプ
   * @returns オーダーブックデータ
   */
  public async fetchOrderBook(symbol: string, limit: number = 100, exchangeType: ExchangeType = 'spot'): Promise<OrderBookData> {
    try {
      // Bitget REST APIの正しいエンドポイント
      const endpoint = `${BITGET_REST_ENDPOINT}/api/v2/spot/market/orderbook`;
      
      // パラメータの準備
      // Bitget REST API ではスラッシュ無し形式 (BTCUSDT) が必要
      const formattedSymbol = symbol.replace('/', '');
      
      const params = {
        symbol: formattedSymbol,
        limit: limit.toString()  // 取得する深さ
      };
      
      logger.debug(`REST APIリクエスト: ${endpoint}`, {
        component: 'BitgetRestClient',
        action: 'fetchOrderBook',
        params
      });
      
      // APIリクエスト
      const response = await axios.get(endpoint, { params });
      
      if (response.data && response.data.data) {
        const data = response.data.data;
        
        // レスポンスデータを変換
        const orderBookData: OrderBookData = {
          asks: data.asks || [],
          bids: data.bids || [],
          symbol,
          timestamp: Date.now()
        } as OrderBookData;
        
        logger.debug(`オーダーブックデータを取得しました: asks=${orderBookData.asks.length}, bids=${orderBookData.bids.length}`, {
          component: 'BitgetRestClient',
          action: 'fetchOrderBook',
          symbol
        });
        
        return orderBookData;
      }
      
      throw new Error('Invalid response data');
    } catch (error) {
      logger.error(`オーダーブックデータの取得に失敗しました: ${error}`, {
        component: 'BitgetRestClient',
        action: 'fetchOrderBook',
        symbol,
        exchangeType,
        error
      });
      
      // エラー時はデモデータを返す
      return {
        asks: [[symbol.split('/')[0] === 'BTC' ? '30000.00' : '2000.00', '1.0']],
        bids: [[symbol.split('/')[0] === 'BTC' ? '29900.00' : '1990.00', '1.0']],
        symbol,
        timestamp: Date.now()
      } as OrderBookData;
    }
  }
  
  /**
   * 過去のローソク足データを取得
   * @param symbol シンボル
   * @param timeframe タイムフレーム
   * @param limit 取得件数
   * @param endTime 終了時間（オプション）
   * @returns ローソク足データの配列
   */
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
   * @param endTime 終了時間（オプション）
   * @returns ローソク足データの配列
   */
  public async fetchCandles(
    symbol: string,
    timeframe: string,
    limit: number = 100,
    exchangeType: ExchangeType = 'spot',
    endTime?: number
  ): Promise<OHLCData[]> {
    try {
      logger.info('fetchCandles called', {
        component: 'BitgetRestClient',
        action: 'fetchCandles',
        symbol,
        timeframe,
        limit
      });
      
      // シンボルをフォーマット
      const formattedSymbol = symbol.replace('/', '');
      
      // タイムフレームを変換
      const granularity = exchangeType === 'spot' 
        ? TIMEFRAME_MAP_SPOT[timeframe] || timeframe
        : TIMEFRAME_MAP_FUTURES[timeframe] || timeframe;
      
      // APIパスを決定
      const endpoint = BITGET_REST_ENDPOINT + (exchangeType === 'spot'
        ? '/api/v2/spot/market/candles'
        : '/api/v2/mix/market/history-candles');
      
      // リクエストパラメータ
      const params: any = {
        symbol: formattedSymbol,
        granularity,
        limit: Math.min(limit, 500) // API上限を超えないよう制限
      };
      
      // endTimeが指定されていれば追加
      if (endTime !== undefined && endTime !== null) {
        params.endTime = endTime.toString();
      }
      
      // Futures APIの場合は追加パラメータが必要
      if (exchangeType === 'futures') {
        params.productType = 'UMCBL'; // Unified Margin Contract
      }
      
      logger.debug('Fetching candles', {
        component: 'BitgetRestClient',
        action: 'fetchCandles',
        endpoint,
        params
      });

      const response = await axios.get(endpoint, { params });
      
      if (response.data && response.data.data) {
        if (response.data.data.length === 0) {
          logger.warn('Empty candle data received', {
            component: 'BitgetRestClient',
            action: 'fetchCandles',
            symbol,
            timeframe
          });
        }
        
        return response.data.data.map((item: any[]) => ({
          time: (() => {
            const ts = parseInt(item[0]);
            return ts < 10000000000 ? ts * 1000 : ts; // 秒→ミリ秒
          })(),
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5])
        }));
      }
      
      throw new Error('Invalid response from Bitget API');
    } catch (error) {
      // APIのエラーレスポンスを取得
      const errorResponse = (error as AxiosError<any>)?.response?.data;
      
      if (errorResponse) {
        logger.error('APIエラーレスポンス:', {
          ...errorResponse
        });
      }
      
      logger.error('過去のローソク足データの取得に失敗しました:', error, {
        component: 'BitgetRestClient',
        action: 'fetchCandles',
        symbol,
        timeframe,
        exchangeType,
        error: (error as Error).message
      });
      
      // 空のレスポンスを返す
      return [];
    }
  }
}
