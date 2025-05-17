/**
 * __tests__/api/rest-client.test.ts
 * REST APIクライアントのユニットテスト
 * 
 * 作成: 2025-05-12 - リファクタリングされたREST APIクライアントのテスト
 */

import { OHLCData, OrderBookData } from '@/types/chart';
import { ExchangeType, ProductType } from '@/types/constants/enums';
import { BitgetRestClient } from '../../services/api/bitget/rest-client';
import axios from 'axios';

// axiosのモック
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BitgetRestClient', () => {
  let client: BitgetRestClient;
  
  beforeEach(() => {
    // クライアントの作成
    client = new BitgetRestClient();
    
    // axiosのモックをリセット
    jest.clearAllMocks();
  });
  
  test('getOrderBook should fetch and transform orderbook data', async () => {
    // モックレスポンスの設定
    const mockResponse = {
      data: {
        code: '00000',
        msg: 'success',
        data: {
          asks: [['30000.00', '1.0'], ['30100.00', '2.0']],
          bids: [['29900.00', '1.0'], ['29800.00', '2.0']],
          ts: 1620000000000
        }
      }
    };
    mockedAxios.get.mockResolvedValueOnce(mockResponse);
    
    // オーダーブックデータを取得
    const result = await client.getOrderBook('BTC/USDT', 'bitget' as ProductType);
    
    // axiosが正しいエンドポイントとパラメータで呼び出されたことを確認
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.bitget.com/api/v2/spot/market/orderbook',
      expect.objectContaining({
        params: expect.objectContaining({
          symbol: 'BTC/USDT',
          limit: '100'
        })
      })
    );
    
    // 結果が正しく変換されたことを確認
    expect(result).toEqual({
      asks: [['30000.00', '1.0'], ['30100.00', '2.0']],
      bids: [['29900.00', '1.0'], ['29800.00', '2.0']],
      timestamp: expect.any(Number)
    });
  });
  
  test('getOrderBook should return demo data on error', async () => {
    // エラーをモック
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
    
    // オーダーブックデータを取得
    const result = await client.getOrderBook('BTC/USDT', 'bitget' as ProductType);
    
    // デモデータが返されたことを確認
    expect(result).toEqual({
      asks: expect.arrayContaining([expect.arrayContaining(['30000.00', '1.0'])]),
      bids: expect.arrayContaining([expect.arrayContaining(['29900.00', '1.0'])]),
      timestamp: expect.any(Number)
    });
  });
  
  test('getHistoricalCandles should fetch and transform candle data', async () => {
    // モックレスポンスの設定
    const mockResponse = {
      data: {
        code: '00000',
        msg: 'success',
        data: [
          ['1620000000000', '30000.00', '30100.00', '29900.00', '30050.00', '10.5'],
          ['1620000060000', '30050.00', '30150.00', '30000.00', '30100.00', '15.2']
        ]
      }
    };
    mockedAxios.get.mockResolvedValueOnce(mockResponse);
    
    // ローソク足データを取得
    const result = await client.getHistoricalCandles('BTC/USDT', '1m', 100);
    
    // axiosが正しいエンドポイントとパラメータで呼び出されたことを確認
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://api.bitget.com/api/v2/spot/market/candles',
      expect.objectContaining({
        params: expect.objectContaining({
          symbol: 'BTC/USDT',
          granularity: '1min',
          limit: '100'
        })
      })
    );
    
    // 結果が正しく変換されたことを確認
    expect(result).toEqual([
      {
        timestamp: 1620000000000,
        open: 30000,
        high: 30100,
        low: 29900,
        close: 30050,
        volume: 10.5
      },
      {
        timestamp: 1620000060000,
        open: 30050,
        high: 30150,
        low: 30000,
        close: 30100,
        volume: 15.2
      }
    ]);
  });
  
  test('getHistoricalCandles should return empty array on error', async () => {
    // エラーをモック
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
    
    // ローソク足データを取得
    const result = await client.getHistoricalCandles('BTC/USDT', '1m', 100);
    
    // 空の配列が返されたことを確認
    expect(result).toEqual([]);
  });
  
  test('getHistoricalCandles should handle invalid response', async () => {
    // 無効なレスポンスをモック
    const mockResponse = {
      data: {
        code: '00000',
        msg: 'success',
        data: null
      }
    };
    mockedAxios.get.mockResolvedValueOnce(mockResponse);
    
    // ローソク足データを取得
    const result = await client.getHistoricalCandles('BTC/USDT', '1m', 100);
    
    // 空の配列が返されたことを確認
    expect(result).toEqual([]);
  });
  
  test('getHistoricalCandles should map timeframes correctly', async () => {
    // モックレスポンスの設定
    const mockResponse = {
      data: {
        code: '00000',
        msg: 'success',
        data: []
      }
    };
    mockedAxios.get.mockResolvedValueOnce(mockResponse);
    
    // 1時間足のデータを取得
    await client.getHistoricalCandles('BTC/USDT', '1h', 100);
    
    // 正しいタイムフレームマッピングが使用されたことを確認
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        params: expect.objectContaining({
          granularity: '1hour'
        })
      })
    );
  });
});
