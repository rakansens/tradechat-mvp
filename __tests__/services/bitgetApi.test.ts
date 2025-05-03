/**
 * Bitget API テストスイート
 * API呼び出しをモックで検証
 */

import axios from 'axios';
import { BitgetApiClient, ExchangeType } from '../../services/bitgetApi';
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

    // Axiosのレスポンスをモック
    mockedAxios.get.mockResolvedValue({
      data: MOCK_CANDLE_DATA
    });
  });

  describe('getHistoricalCandles', () => {
    // スポット取引のテスト
    test('スポット取引 - BTC/USDT - 1分足データを取得できる', async () => {
      const api = new BitgetApiClient({}, 'spot');
      const data = await api.getHistoricalCandles('BTC/USDT', '1m', 10);
      
      // 基本的な検証
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2); // モックデータのサイズ
      
      // データ形式の検証
      const firstCandle = data[0];
      expect(firstCandle).toHaveProperty('time');
      expect(firstCandle).toHaveProperty('open');
      expect(firstCandle).toHaveProperty('high');
      expect(firstCandle).toHaveProperty('low');
      expect(firstCandle).toHaveProperty('close');
      expect(firstCandle).toHaveProperty('volume');
      
      // 値の型をチェック
      expect(typeof firstCandle.time).toBe('number');
      expect(typeof firstCandle.open).toBe('number');
      expect(typeof firstCandle.high).toBe('number');
      expect(typeof firstCandle.low).toBe('number');
      expect(typeof firstCandle.close).toBe('number');
      expect(typeof firstCandle.volume).toBe('number');
      
      // 実際の値をチェック
      expect(firstCandle.time).toBe(1620000000000);
      expect(firstCandle.open).toBe(50000);
      
      // ブラウザ環境では内部APIを呼び出す
      if (typeof window !== 'undefined') {
        expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('/api/bitget/candles'));
      } else {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('api.bitget.com'),
          expect.objectContaining({ params: expect.any(Object) })
        );
      }
    });
    
    // 先物取引のテスト
    test('先物取引 - BTC/USDT - 1時間足データを取得できる', async () => {
      const api = new BitgetApiClient({}, 'futures');
      const data = await api.getHistoricalCandles('BTC/USDT', '1h', 10);
      
      // 基本的な検証
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2); // モックデータのサイズ
      
      // データ形式の検証
      const firstCandle = data[0];
      expect(firstCandle).toHaveProperty('time');
      expect(firstCandle).toHaveProperty('open');
      expect(firstCandle).toHaveProperty('high');
      expect(firstCandle).toHaveProperty('low');
      expect(firstCandle).toHaveProperty('close');
      expect(firstCandle).toHaveProperty('volume');
      
      // 先物取引特有のパラメータを確認
      if (typeof window !== 'undefined') {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringMatching(/type=futures/)
        );
      } else {
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('/api/mix/v1/market/candles'),
          expect.objectContaining({
            params: expect.objectContaining({
              symbol: expect.stringMatching(/_UMCBL$/)
            })
          })
        );
      }
    });
    
    // エラーハンドリングのテスト
    test('APIエラーが適切に処理される', async () => {
      // エラーレスポンスをモック
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));
      
      const api = new BitgetApiClient({}, 'spot');
      
      // エラーを投げることを期待
      await expect(api.getHistoricalCandles('BTC/USDT', '1m', 10))
        .rejects
        .toThrow();
    });
  });
  
  describe('WebSocket関連機能', () => {
    // WebSocketをモックするためのセットアップ
    let mockWS: any;

    beforeEach(() => {
      // WebSocketのモックをリセット
      mockWS = {
        onopen: null,
        onmessage: null,
        onerror: null,
        onclose: null,
        readyState: WebSocket.OPEN,
        close: jest.fn(),
        send: jest.fn()
      };

      // WebSocket constructor をモック
      global.WebSocket = jest.fn(() => mockWS) as any;
    });

    // WebSocketの接続テスト
    test('WebSocketに接続できる', () => {
      const api = new BitgetApiClient({}, 'spot');
      api.connectWebSocket();
      
      // onopen ハンドラが設定されたことを確認
      expect(mockWS.onopen).toBeDefined();
      expect(mockWS.onmessage).toBeDefined();
      expect(mockWS.onerror).toBeDefined();
      expect(mockWS.onclose).toBeDefined();
    });
    
    test('Klineデータを購読できる', () => {
      const api = new BitgetApiClient({}, 'spot');
      api.connectWebSocket();
      
      // WebSocketが接続されていることを確認
      expect(global.WebSocket).toHaveBeenCalledWith(expect.any(String));
      
      // readyStateをOPENに設定（必要に応じて）
      mockWS.readyState = WebSocket.OPEN;
      
      // サブスクリプション実行
      api.subscribeToKline('BTC/USDT', '1m');
      
      // サブスクリプションメッセージが送信されることを検証
      expect(mockWS.send).toHaveBeenCalled();
      
      // サブスクリプションペイロードの内容を検証（モックが呼び出された場合）
      if (mockWS.send.mock.calls.length > 0) {
        const sentMessage = mockWS.send.mock.calls[0][0];
        const parsedMessage = JSON.parse(sentMessage);
        
        expect(parsedMessage).toHaveProperty('op', 'subscribe');
        expect(parsedMessage).toHaveProperty('args');
        expect(parsedMessage.args[0]).toHaveProperty('instType', 'sp');
        expect(parsedMessage.args[0]).toHaveProperty('channel', 'candle1min');
        expect(parsedMessage.args[0]).toHaveProperty('instId', 'BTCUSDT');
      }
    });
    
    test('WebSocket切断が正しく動作する', () => {
      const api = new BitgetApiClient({}, 'spot');
      api.connectWebSocket();
      api.disconnectWebSocket();
      
      // WebSocketが閉じられたことを確認
      expect(mockWS.close).toHaveBeenCalled();
    });
    
    // onKlineUpdateコールバックのテスト
    test('onKlineUpdateコールバックが登録され、データを正しく処理する', () => {
      const api = new BitgetApiClient({}, 'spot');
      const mockCallback = jest.fn();
      
      // コールバックを登録
      api.onKlineUpdate(mockCallback);
      
      // WebSocketを接続
      api.connectWebSocket();
      
      // WebSocketがメッセージを受信した場合をシミュレート
      const mockKlineMessage = {
        arg: {
          channel: 'candle1min',
          instId: 'BTCUSDT'
        },
        data: [
          ['1620000000000', '50000', '51000', '49000', '50500', '100']
        ]
      };
      
      // onmessageハンドラを呼び出し
      if (mockWS.onmessage) {
        mockWS.onmessage({
          data: JSON.stringify(mockKlineMessage)
        });
        
        // コールバックが呼び出されることを期待
        expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
          time: 1620000000000,
          open: 50000,
          high: 51000,
          low: 49000,
          close: 50500,
          volume: 100
        }));
      }
    });
  });

  describe('取引種別の切り替え', () => {
    test('取引種別を切り替えられる', () => {
      const api = new BitgetApiClient({}, 'spot');
      
      // デフォルトはスポット取引
      expect((api as any).exchangeType).toBe('spot');
      
      // 先物取引に切り替え
      api.setExchangeType('futures');
      expect((api as any).exchangeType).toBe('futures');
      
      // スポット取引に戻す
      api.setExchangeType('spot');
      expect((api as any).exchangeType).toBe('spot');
    });
  });
}); 