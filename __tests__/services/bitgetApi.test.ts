/**
 * Bitget API テストスイート
 * API呼び出しをモックで検証
 */

import axios from 'axios';
import { BitgetApiClient } from '../../services/bitgetApi';
import { ExchangeType } from '../../types/api';
import { OHLCData } from '../../types/chart';

// APIモック用サンプルデータ
const MOCK_CANDLE_DATA = {
  code: '00000',
  data: [
    ['1620000000000', '50000', '51000', '49000', '50500', '100'],
    ['1620001000000', '50500', '52000', '50000', '51500', '200'],
  ],
  msg: 'success'
};

// テストタイムアウトを設定
jest.setTimeout(10000);

// Axiosをモック化
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BitgetApiClient', () => {
  // 各テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 正常系: ローソク足データの取得
  test('getHistoricalCandles - 正常系: 成功時にOHLCデータを返すべき', async () => {
    // モックレスポンスの設定
    mockedAxios.get.mockResolvedValueOnce({
      data: MOCK_CANDLE_DATA,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    });

    // APIクライアントの初期化
    const client = new BitgetApiClient();
    
    // テスト対象メソッドの呼び出し
    const result = await client.getHistoricalCandles('BTCUSDT', '1m', 2);
    
    // 結果の検証
    expect(result).toBeDefined();
    expect(result.length).toBe(2);
    expect(result[0].timestamp).toBe(1620000000000);
    expect(result[0].open).toBe(50000);
    expect(result[0].high).toBe(51000);
    expect(result[0].low).toBe(49000);
    expect(result[0].close).toBe(50500);
    expect(result[0].volume).toBe(100);
    
    // Axiosが正しいURLで呼び出されたことを検証
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/mix/v1/market/candles'),
      expect.objectContaining({
        params: expect.objectContaining({
          symbol: 'BTCUSDT',
          granularity: '60'
        })
      })
    );
  });

  // 異常系: APIエラー
  test('getCandles - 異常系: APIエラー時に例外をスローすべき', async () => {
    // エラーレスポンスのモック
    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));
    
    // APIクライアントの初期化
    const client = new BitgetApiClient();
    
    // エラーハンドリングの検証
    await expect(
      client.getHistoricalCandles('BTCUSDT', '1m', 2)
    ).rejects.toThrow();
  });
});