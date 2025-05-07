import { BitgetApiClient } from '../../services/bitgetApi';
import { ExchangeType } from '../../types/api';
import { BitgetOrderBookResponse } from '../../types/market';
import axios from 'axios';

// axiosをモック
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BitgetApiClient - OrderBook', () => {
  // テスト前に実行
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 正常系: オーダーブックデータの取得
  test('getOrderBook - 正常系: 成功時にオーダーブックデータを返すべき', async () => {
    // モックレスポンスの準備
    const mockResponse: BitgetOrderBookResponse = {
      code: '00000',
      data: {
        asks: [
          ['40000.5', '1.2'],
          ['40001.0', '0.5'],
          ['40002.0', '2.0']
        ],
        bids: [
          ['39999.5', '1.5'],
          ['39998.0', '2.2'],
          ['39997.0', '1.0']
        ],
        timestamp: '1620000000000'
      },
      msg: 'success'
    };

    // axiosのgetメソッドをモック
    mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

    // APIクライアントのインスタンス化
    const client = new BitgetApiClient();
    const result = await client.getOrderBook('BTC/USDT');

    // 期待される結果との比較
    expect(result).toEqual({
      symbol: 'BTC/USDT',
      timestamp: 1620000000000,
      asks: [
        { price: 40000.5, amount: 1.2 },
        { price: 40001.0, amount: 0.5 },
        { price: 40002.0, amount: 2.0 }
      ],
      bids: [
        { price: 39999.5, amount: 1.5 },
        { price: 39998.0, amount: 2.2 },
        { price: 39997.0, amount: 1.0 }
      ]
    });

    // 正しいURLとパラメータで呼び出されたことを確認
    expect(mockedAxios.get).toHaveBeenCalled();
    const url = mockedAxios.get.mock.calls[0][0];
    expect(url).toContain('/api/bitget/orderbook');
  });

  // 異常系: 無効なシンボル
  test('getOrderBook - 異常系: 無効なシンボルでエラーを投げるべき', async () => {
    // エラーレスポンスをモック
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        code: '40004',
        data: null,
        msg: 'Invalid symbol'
      }
    });

    const client = new BitgetApiClient();
    
    // エラーがスローされることを期待
    await expect(client.getOrderBook('INVALID/SYMBOL'))
      .rejects
      .toThrow('Bitget API Error: Invalid symbol');
  });

  // 異常系: API接続エラー
  test('getOrderBook - 異常系: ネットワークエラーを適切に処理するべき', async () => {
    // ネットワークエラーをシミュレート
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

    const client = new BitgetApiClient();
    
    // エラーハンドリングが適切に行われることを期待
    await expect(client.getOrderBook('BTC/USDT'))
      .rejects
      .toThrow('Failed to fetch order book: Network error');
  });

  // 先物取引のオーダーブック取得
  test('getOrderBook - 先物取引用のエンドポイントを使用するべき', async () => {
    // モックレスポンスの準備
    const mockResponse: BitgetOrderBookResponse = {
      code: '00000',
      data: {
        asks: [['40000.5', '1.2']],
        bids: [['39999.5', '1.5']],
        timestamp: '1620000000000'
      },
      msg: 'success'
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

    const client = new BitgetApiClient({}, 'futures');
    await client.getOrderBook('BTC/USDT');

    // 呼び出し引数を確認
    expect(mockedAxios.get).toHaveBeenCalled();
    const [url, config] = mockedAxios.get.mock.calls[0];
    
    // type=futuresパラメータが含まれていることを確認
    expect(url).toContain('type=futures');
  });
}); 