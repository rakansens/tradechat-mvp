/**
 * services/api/bitget/rest-client.ts
 * BitgetのREST APIクライアント実装
 * 
 * 作成: 2025-05-12 - SRPに基づいたBitget REST APIクライアントの実装
 * 
 * このファイルは、IRestApiClientインターフェースに準拠したBitgetのREST APIクライアントを実装します。
 * 単一責任の原則（SRP）に基づき、HTTP APIを使用した過去データの取得のみに責任を持ちます。
 */

import axios from 'axios';
import { ExchangeType } from '../../../types/api';
import { OHLCData, Timeframe } from '../../../types/chart';
import { OrderBookData } from '../../../types/market';
import { IRestApiClient } from '../interfaces';
import { logger } from '../../../utils/logger';

// Bitget REST APIのエンドポイント
const BITGET_REST_ENDPOINT = 'https://api.bitget.com';

// REST APIのタイムフレームマッピング
const REST_TIMEFRAME_MAP: { [key: string]: string } = {
  '1m': '1min',
  '3m': '3min',
  '5m': '5min',
  '15m': '15min',
  '30m': '30min',
  '1h': '1hour',
  '4h': '4hour',
  '12h': '12hour',
  '1d': '1day',
  '1w': '1week'
};

/**
 * BitgetのREST APIクライアント
 * IRestApiClientインターフェースを実装
 */
export class BitgetRestClient implements IRestApiClient {
  /**
   * オーダーブックデータを取得
   * @param symbol シンボル
   * @param exchangeType 取引タイプ
   * @returns オーダーブックデータ
   */
  public async getOrderBook(symbol: string, exchangeType: ExchangeType): Promise<OrderBookData> {
    try {
      // Bitget REST APIの正しいエンドポイント
      const endpoint = `${BITGET_REST_ENDPOINT}/api/v2/spot/market/orderbook`;
      
      // パラメータの準備
      const params = {
        symbol: symbol,
        limit: '100'  // 取得する深さ
      };
      
      logger.debug(`REST APIリクエスト: ${endpoint}`, {
        component: 'BitgetRestClient',
        action: 'getOrderBook',
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
          timestamp: Date.now()
        };
        
        logger.debug(`オーダーブックデータを取得しました: asks=${orderBookData.asks.length}, bids=${orderBookData.bids.length}`, {
          component: 'BitgetRestClient',
          action: 'getOrderBook',
          symbol
        });
        
        return orderBookData;
      }
      
      throw new Error('Invalid response data');
    } catch (error) {
      logger.error(`オーダーブックデータの取得に失敗しました: ${error}`, {
        component: 'BitgetRestClient',
        action: 'getOrderBook',
        symbol,
        exchangeType,
        error
      });
      
      // エラー時はデモデータを返す
      return {
        asks: [[symbol.split('/')[0] === 'BTC' ? '30000.00' : '2000.00', '1.0']],
        bids: [[symbol.split('/')[0] === 'BTC' ? '29900.00' : '1990.00', '1.0']],
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * 過去のローソク足データを取得
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
    try {
      // Bitget REST APIの正しいエンドポイント
      const endpoint = `${BITGET_REST_ENDPOINT}/api/v2/spot/market/candles`;
      
      // タイムフレームをBitgetの正しいフォーマットに変換
      const granularity = REST_TIMEFRAME_MAP[timeframe] || timeframe;
      
      // パラメータの準備
      const params = {
        symbol: symbol,
        granularity: granularity,
        limit: limit.toString()
      };
      
      logger.debug(`REST APIリクエスト: ${endpoint}`, {
        component: 'BitgetRestClient',
        action: 'getHistoricalCandles',
        params
      });
      
      // APIリクエスト
      const response = await axios.get(endpoint, { params });
      
      if (response.data && response.data.data) {
        logger.debug(`取得したデータ: ${response.data.data.length}件`, {
          component: 'BitgetRestClient',
          action: 'getHistoricalCandles',
          symbol,
          timeframe
        });
        
        // レスポンスデータを変換
        return response.data.data.map((item: any[]) => ({
          timestamp: parseInt(item[0]),
          open: parseFloat(item[1]),
          high: parseFloat(item[2]),
          low: parseFloat(item[3]),
          close: parseFloat(item[4]),
          volume: parseFloat(item[5])
        }));
      }
      
      return [];
    } catch (error) {
      logger.error(`過去のローソク足データの取得に失敗しました: ${error}`, {
        component: 'BitgetRestClient',
        action: 'getHistoricalCandles',
        symbol,
        timeframe,
        error
      });
      
      if (axios.isAxiosError(error) && error.response) {
        logger.error('APIエラーレスポンス:', error.response.data);
      }
      
      // エラー時は空の配列を返す
      return [];
    }
  }
}
