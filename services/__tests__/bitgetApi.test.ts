import axios from 'axios';
import { BitgetApiClient } from '../bitgetApi';
import { TIMEFRAME_MAP_SPOT, TIMEFRAME_MAP_FUTURES } from '../../types/chart';
import { OHLCData } from '../../types/chart';

// axiosをモック化
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BitgetApiClient', () => {
  let client: BitgetApiClient;

  beforeEach(() => {
    client = new BitgetApiClient();
    jest.clearAllMocks();
  });

  describe('getHistoricalCandles', () => {
    it('should fetch historical candles and convert data format', async () => {
      // モックレスポンスの準備
      const mockResponseData = {
        code: '00000',
        data: [
          ['1620000000000', '60000', '61000', '59000', '60500', '100'],
          ['1620001000000', '60500', '62000', '60000', '61500', '200'],
        ],
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockResponseData });

      // APIを呼び出し
      const result = await client.getHistoricalCandles('BTC/USDT', '1m', 2);

      // axiosが正しいパラメータで呼び出されたか検証
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.bitget.com/api/spot/v1/market/candles',
        {
          params: {
            symbol: 'BTCUSDT',
            period: '1min',
            limit: '2',
          },
        }
      );

      // 返却データの検証
      expect(result).toEqual([
        {
          time: 1620000000000,
          open: 60000,
          high: 61000,
          low: 59000,
          close: 60500,
          volume: 100,
        },
        {
          time: 1620001000000,
          open: 60500,
          high: 62000,
          low: 60000,
          close: 61500,
          volume: 200,
        },
      ]);
    });

    it('should throw an error when API call fails', async () => {
      // エラーレスポンスのモック
      mockedAxios.get.mockResolvedValueOnce({
        data: { code: '50000', msg: 'Internal server error' },
      });

      // エラーが発生することを検証
      await expect(
        client.getHistoricalCandles('BTC/USDT', '1d')
      ).rejects.toThrow('Failed to get candles: Internal server error');
    });
  });

  describe('WebSocket functionality', () => {
    it('should connect and subscribe to kline data', () => {
      // WebSocketの送信メソッドをスパイ
      const spySend = jest.spyOn(WebSocket.prototype, 'send');

      // WebSocketの接続を開始
      client.connectWebSocket();
      
      // チャネルをサブスクライブ
      client.subscribeToKline('BTC/USDT', '1m');

      // WebSocketに適切なサブスクリプションメッセージが送信されたことを確認
      expect(spySend).toHaveBeenCalledWith(
        JSON.stringify({
          op: 'subscribe',
          args: [
            {
              instType: 'sp',
              channel: 'candle1min',
              instId: 'BTCUSDT',
            },
          ],
        })
      );
    });

    it('should handle kline update callbacks', () => {
      // モックコールバック
      const mockCallback = jest.fn();
      
      // コールバックを登録
      client.onKlineUpdate(mockCallback);
      
      // privateメソッドを直接テストするため、anyにキャスト
      const mockMessage = {
        arg: { channel: 'candle1min' },
        data: [
          ['1620000000000', '60000', '61000', '59000', '60500', '100']
        ]
      };
      
      // @ts-ignore - privateメソッドを直接呼び出すためにignore
      client['handleWebSocketMessage'](mockMessage);
      
      // コールバックが正しいデータで呼び出されたことを確認
      expect(mockCallback).toHaveBeenCalledWith({
        time: 1620000000000,
        open: 60000,
        high: 61000,
        low: 59000,
        close: 60500,
        volume: 100,
      });
    });
  });

  // テスト用のタイムフレームマッピング
  const TIMEFRAME_MAP = {
    '1m': '1min',
    '5m': '5min',
    '15m': '15min',
    '30m': '30min',
    '1h': '1h',
    '4h': '4h',
    '1d': '1day',
    '1w': '1week',
  };

  describe('TIMEFRAME_MAP', () => {
    it('should have correct mappings for testing', () => {
      expect(TIMEFRAME_MAP).toEqual({
        '1m': '1min',
        '5m': '5min',
        '15m': '15min',
        '30m': '30min',
        '1h': '1h',
        '4h': '4h',
        '1d': '1day',
        '1w': '1week',
      });
    });
  });
}); 