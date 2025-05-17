/**
 * __tests__/services/api/bitget/rest-client.test.ts
 * BitgetRestClient クラスのテスト
 * 
 * 作成: 2025-05-13 - BitgetRestClientのテスト作成
 * 更新: 2025-05-13 - ネットワークエラー、シンボル正規化、タイムフレーム変換テストの追加
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { BitgetRestClient } from '../../../../services/api/bitget/rest-client';
import { logger } from '../../../../utils/logger';

// モックの設定
const mock = new MockAdapter(axios);
jest.mock('../../../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('BitgetRestClient', () => {
  beforeEach(() => {
    mock.reset();
    jest.clearAllMocks();
  });

  afterAll(() => {
    mock.restore();
  });

  describe('fetchCandles', () => {
    it('スポット取引のローソク足データを正しく取得できること', async () => {
      // モックレスポンスの設定 - Bitget APIの実際のレスポンス形式
      const mockResponse = {
        code: '00000',
        data: [
          ['1620000000000', '50000', '51000', '49000', '50500', '100'],
          ['1620086400000', '50500', '52000', '50000', '51500', '120']
        ],
        msg: 'success'
      };
      
      // モックの設定
      mock.onGet().reply(200, mockResponse);
      
      // インスタンス作成
      const client = new BitgetRestClient();
      
      // fetchCandlesの実行
      const result = await client.fetchCandles('BTC/USDT', '1d', 2);
      
      // 結果の検証
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('time', 1620000000000);
      expect(result[0]).toHaveProperty('open', 50000);
      expect(result[0]).toHaveProperty('high', 51000);
      expect(result[0]).toHaveProperty('low', 49000);
      expect(result[0]).toHaveProperty('close', 50500);
      expect(result[0]).toHaveProperty('volume', 100);
    });

    it('先物取引のローソク足データを正しく取得できること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        code: '00000',
        data: [
          ['1620000000000', '50000', '51000', '49000', '50500', '100'],
          ['1620086400000', '50500', '52000', '50000', '51500', '120']
        ],
        msg: 'success'
      };
      
      // モックの設定
      mock.onGet().reply(200, mockResponse);
      
      // インスタンス作成
      const client = new BitgetRestClient();
      
      // fetchCandlesの実行（futures）
      const result = await client.fetchCandles('BTC/USDT', '1d', 2, 'futures');
      
      // 結果の検証
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('time', 1620000000000);
      expect(result[0]).toHaveProperty('open', 50000);
      expect(result[0]).toHaveProperty('high', 51000);
      expect(result[0]).toHaveProperty('low', 49000);
      expect(result[0]).toHaveProperty('close', 50500);
      expect(result[0]).toHaveProperty('volume', 100);
      
      // 適切なエンドポイントとパラメータが使用されたか確認
      expect(mock.history.get[0].url).toContain('/api/v2/mix/market/candles');
      expect(mock.history.get[0].params).toHaveProperty('productType', 'usdt-futures');
    });

    it('endTimeパラメータが正しく送信されること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        code: '00000',
        data: [
          ['1620000000000', '50000', '51000', '49000', '50500', '100']
        ],
        msg: 'success'
      };
      
      // モックの設定
      mock.onGet().reply(200, mockResponse);
      
      // インスタンス作成
      const client = new BitgetRestClient();
      
      // 特定のendTimeでfetchCandlesを実行
      const endTime = 1620100000000;
      await client.fetchCandles('BTC/USDT', '1d', 1, 'spot', endTime);
      
      // リクエストパラメータにendTimeが含まれているか確認
      expect(mock.history.get[0].params).toHaveProperty('endTime', endTime.toString());
    });

    it('APIエラー時に適切にエラーがスローされること', async () => {
      // エラーレスポンスの設定
      const mockResponse = {
        code: '00001',
        msg: 'Invalid parameter'
      };
      
      // モックの設定
      mock.onGet().reply(200, mockResponse);
      
      // インスタンス作成
      const client = new BitgetRestClient();
      
      // エラーをキャッチする
      await expect(client.fetchCandles('BTC/USDT', '1d', 1)).rejects.toThrow();
      
      // エラーがログ出力されたことを確認
      expect(logger.error).toHaveBeenCalled();
    });

    it('ネットワークエラー時に適切にエラーがスローされること', async () => {
      // ネットワークエラーの設定
      mock.onGet().networkError();
      
      // インスタンス作成
      const client = new BitgetRestClient();
      
      // エラーをキャッチする
      await expect(client.fetchCandles('BTC/USDT', '1d', 1)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });

    it('シンボルが正しく正規化されること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        code: '00000',
        data: [['1620000000000', '50000', '51000', '49000', '50500', '100']],
        msg: 'success'
      };
      
      mock.onGet().reply(200, mockResponse);
      
      const client = new BitgetRestClient();
      await client.fetchCandles('BTC/USDT', '1d', 1);
      
      // パラメータでシンボルが正規化されているか確認
      expect(mock.history.get[0].params.symbol).toBe('BTCUSDT');
    });

    it('タイムフレームが正しく変換されること', async () => {
      const mockResponse = {
        code: '00000',
        data: [['1620000000000', '50000', '51000', '49000', '50500', '100']],
        msg: 'success'
      };
      
      mock.onGet().reply(200, mockResponse);
      
      const client = new BitgetRestClient();
      
      // 先物取引で時間足形式が大文字になることを確認 (1h -> 1H)
      await client.fetchCandles('BTC/USDT', '1h', 1, 'futures');
      expect(mock.history.get[0].params.granularity).toBe('1H');
      
      // スポット取引で時間足形式が適切に変換されることを確認
      mock.resetHistory();
      mock.onGet().reply(200, mockResponse);
      await client.fetchCandles('BTC/USDT', '1h', 1, 'spot');
      expect(mock.history.get[0].params.granularity).toBe('1h');
    });
  });

  describe('fetchOrderBook', () => {
    it('スポット取引のオーダーブックデータを正しく取得できること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        code: '00000',
        data: {
          asks: [
            ['50100', '1.5'],
            ['50200', '2.3']
          ],
          bids: [
            ['49900', '3.2'],
            ['49800', '4.1']
          ],
          timestamp: 1620000000000
        },
        msg: 'success'
      };
      
      // モックの設定
      mock.onGet().reply(200, mockResponse);
      
      // インスタンス作成
      const client = new BitgetRestClient();
      
      // fetchOrderBookの実行
      const result = await client.fetchOrderBook('BTC/USDT', 2);
      
      // 結果の検証
      expect(result).toHaveProperty('symbol', 'BTCUSDT');
      expect(result).toHaveProperty('timestamp', 1620000000000);
      expect(result.asks.length).toBe(2);
      expect(result.bids.length).toBe(2);
      expect(result.asks[0]).toHaveProperty('price', 50100);
      expect(result.asks[0]).toHaveProperty('amount', 1.5);
      expect(result.bids[0]).toHaveProperty('price', 49900);
      expect(result.bids[0]).toHaveProperty('amount', 3.2);
    });

    it('先物取引のオーダーブックデータを正しく取得できること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        code: '00000',
        data: {
          asks: [
            ['50100', '1.5'],
            ['50200', '2.3']
          ],
          bids: [
            ['49900', '3.2'],
            ['49800', '4.1']
          ],
          timestamp: 1620000000000
        },
        msg: 'success'
      };
      
      // モックの設定
      mock.onGet().reply(200, mockResponse);
      
      // インスタンス作成
      const client = new BitgetRestClient();
      
      // fetchOrderBookの実行（futures）
      const result = await client.fetchOrderBook('BTC/USDT', 2, 'futures');
      
      // 結果の検証
      expect(result).toHaveProperty('symbol', 'BTCUSDT');
      expect(result).toHaveProperty('timestamp', 1620000000000);
      expect(result.asks.length).toBe(2);
      expect(result.bids.length).toBe(2);
      
      // 適切なエンドポイントとパラメータが使用されたか確認
      expect(mock.history.get[0].url).toContain('/api/v2/mix/market/orderbook');
      expect(mock.history.get[0].params).toHaveProperty('productType', 'usdt-futures');
    });

    it('APIエラー時に適切にエラーがスローされること', async () => {
      // エラーレスポンスの設定
      const mockResponse = {
        code: '00001',
        msg: 'Invalid parameter'
      };
      
      // モックの設定
      mock.onGet().reply(200, mockResponse);
      
      // インスタンス作成
      const client = new BitgetRestClient();
      
      // エラーをキャッチする
      await expect(client.fetchOrderBook('BTC/USDT', 10)).rejects.toThrow();
      
      // エラーがログ出力されたことを確認
      expect(logger.error).toHaveBeenCalled();
    });

    it('ネットワークエラー時に適切にエラーがスローされること', async () => {
      // ネットワークエラーの設定
      mock.onGet().networkError();
      
      // インスタンス作成
      const client = new BitgetRestClient();
      
      // エラーをキャッチする
      await expect(client.fetchOrderBook('BTC/USDT', 10)).rejects.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });

    it('シンボルが正しく正規化されること', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        code: '00000',
        data: {
          asks: [['50100', '1.5']],
          bids: [['49900', '3.2']],
          timestamp: 1620000000000
        },
        msg: 'success'
      };
      
      mock.onGet().reply(200, mockResponse);
      
      const client = new BitgetRestClient();
      await client.fetchOrderBook('ETH/BTC', 1);
      
      // パラメータでシンボルが正規化されているか確認
      expect(mock.history.get[0].params.symbol).toBe('ETHBTC');
    });
  });

  describe('getHistoricalCandles', () => {
    it('fetchCandlesを正しく呼び出すこと', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        code: '00000',
        data: [
          ['1620000000000', '50000', '51000', '49000', '50500', '100'],
          ['1620086400000', '50500', '52000', '50000', '51500', '120']
        ],
        msg: 'success'
      };
      
      // モックの設定
      mock.onGet().reply(200, mockResponse);
      
      // インスタンス作成
      const client = new BitgetRestClient();
      const spy = jest.spyOn(client, 'fetchCandles');
      
      // getHistoricalCandlesの実行
      await client.getHistoricalCandles('BTC/USDT', '1d', 2);
      
      // fetchCandlesが正しく呼び出されたか確認
      expect(spy).toHaveBeenCalledWith('BTC/USDT', '1d', 2);
    });
  });

  describe('getOrderBook', () => {
    it('fetchOrderBookを正しく呼び出すこと', async () => {
      // モックレスポンスの設定
      const mockResponse = {
        code: '00000',
        data: {
          asks: [
            ['50100', '1.5'],
            ['50200', '2.3']
          ],
          bids: [
            ['49900', '3.2'],
            ['49800', '4.1']
          ],
          timestamp: 1620000000000
        },
        msg: 'success'
      };
      
      // モックの設定
      mock.onGet().reply(200, mockResponse);
      
      // インスタンス作成
      const client = new BitgetRestClient();
      const spy = jest.spyOn(client, 'fetchOrderBook');
      
      // getOrderBookの実行
      await client.getOrderBook('BTC/USDT', 'bitget');
      
      // fetchOrderBookが正しく呼び出されたか確認
      expect(spy).toHaveBeenCalledWith('BTC/USDT', 100, 'bitget');
    });
  });

  describe('parseCandlesData', () => {
    it('ローソク足データを正しくパースすること', async () => {
      // プライベートメソッドをテストするため、クラスをインスタンス化
      const client = new BitgetRestClient();
      
      // テストデータ
      const candlesData = [
        ['1620000000000', '50000', '51000', '49000', '50500', '100'],
        ['1620086400000', '50500', '52000', '50000', '51500', '120']
      ];
      
      // プライベートメソッドにアクセスするため、anyにキャストして呼び出す
      const result = (client as any).parseCandlesData(candlesData);
      
      // 結果の検証
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('time', 1620000000000);
      expect(result[0]).toHaveProperty('open', 50000);
      expect(result[0]).toHaveProperty('high', 51000);
      expect(result[0]).toHaveProperty('low', 49000);
      expect(result[0]).toHaveProperty('close', 50500);
      expect(result[0]).toHaveProperty('volume', 100);
    });

    it('無効なデータが渡された場合に空配列を返すこと', async () => {
      // プライベートメソッドをテストするため、クラスをインスタンス化
      const client = new BitgetRestClient();
      
      // 無効なテストデータ
      const invalidData = "not an array";
      
      // プライベートメソッドにアクセス
      const result = (client as any).parseCandlesData(invalidData);
      
      // 空配列が返されることを確認
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
      
      // 警告がログに出力されることを確認
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('parseOrderBookData', () => {
    it('オーダーブックデータを正しくパースすること', async () => {
      // プライベートメソッドをテストするため、クラスをインスタンス化
      const client = new BitgetRestClient();
      
      // テストデータ
      const orderBookData = {
        asks: [
          ['50100', '1.5'],
          ['50200', '2.3']
        ],
        bids: [
          ['49900', '3.2'],
          ['49800', '4.1']
        ],
        timestamp: 1620000000000
      };
      
      // プライベートメソッドにアクセス
      const result = (client as any).parseOrderBookData(orderBookData, 'BTCUSDT');
      
      // 結果の検証
      expect(result).toHaveProperty('symbol', 'BTCUSDT');
      expect(result).toHaveProperty('timestamp', 1620000000000);
      expect(result.asks.length).toBe(2);
      expect(result.bids.length).toBe(2);
      expect(result.asks[0]).toHaveProperty('price', 50100);
      expect(result.asks[0]).toHaveProperty('amount', 1.5);
      expect(result.bids[0]).toHaveProperty('price', 49900);
      expect(result.bids[0]).toHaveProperty('amount', 3.2);
    });

    it('timestampフィールドが異なる場合も正しくパースすること', async () => {
      // プライベートメソッドをテストするため、クラスをインスタンス化
      const client = new BitgetRestClient();
      
      // テストデータ - timestampの代わりにtsを使用
      const orderBookData = {
        asks: [
          ['50100', '1.5']
        ],
        bids: [
          ['49900', '3.2']
        ],
        ts: 1620000000000
      };
      
      // プライベートメソッドにアクセス
      const result = (client as any).parseOrderBookData(orderBookData, 'BTCUSDT');
      
      // 結果の検証 - tsからtimestampが正しく抽出されることを確認
      expect(result).toHaveProperty('timestamp', 1620000000000);
    });
  });
}); 