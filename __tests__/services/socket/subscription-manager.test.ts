/**
 * __tests__/services/socket/subscription-manager.test.ts
 * SubscriptionManagerクラスのテスト
 * 
 * 作成: 2025-05-12 - WebSocketサービスのリファクタリングに伴い新規作成
 * 更新: 2025-05-12 - 循環参照の問題を解決するためにモックの設定を修正
 */

import { Socket } from 'socket.io-client';
import { SubscriptionManager, CHANNEL } from '../../../services/socket/subscription-manager';
import { IWebSocketClient } from '../../../services/socket/interfaces';
import { OrderBookData } from '../../../types/market';
import { OHLCData } from '../../../types/chart';
import { ExchangeType } from '../../../types/api';

// WebSocketClientとloggerのモジュールをモック
jest.mock('../../../services/socket/websocket-client', () => ({
  getWebSocketClient: jest.fn(),
  resetWebSocketClientForTesting: jest.fn()
}));

jest.mock('../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// モックをインポート
const { logger } = require('../../../utils/logger');

// モック
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connected: true
};

// WebSocketClientモック
const mockWebSocketClient: IWebSocketClient = {
  initialize: jest.fn(),
  getSocket: jest.fn().mockReturnValue(mockSocket),
  isConnected: jest.fn().mockReturnValue(true),
  disconnect: jest.fn(),
  scheduleReconnect: jest.fn()
};

jest.mock('../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('SubscriptionManager', () => {
  let subscriptionManager: SubscriptionManager;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // SubscriptionManagerインスタンスを作成
    subscriptionManager = new SubscriptionManager(mockWebSocketClient);
  });
  
  describe('subscribeOrderBook', () => {
    it('ソケットが初期化されていない場合は空の関数を返すこと', () => {
      // getSocketの戻り値をnullに設定
      (mockWebSocketClient.getSocket as jest.Mock).mockReturnValueOnce(null);
      
      // subscribeOrderBookを実行
      const unsubscribe = subscriptionManager.subscribeOrderBook('BTC/USDT', jest.fn());
      
      // 結果を検証
      expect(unsubscribe).toBeInstanceOf(Function);
      expect(logger.error).toHaveBeenCalledWith(
        'ソケットが初期化されていません',
        expect.objectContaining({
          component: 'SubscriptionManager',
          action: 'subscribeOrderBook'
        })
      );
    });
    
    it('正常に購読できること', () => {
      // コールバック関数
      const callback = jest.fn();
      
      // subscribeOrderBookを実行
      const unsubscribe = subscriptionManager.subscribeOrderBook('BTC/USDT', callback);
      
      // 結果を検証
      expect(unsubscribe).toBeInstanceOf(Function);
      expect(mockSocket.emit).toHaveBeenCalledWith(
        CHANNEL.SUBSCRIBE,
        expect.objectContaining({
          symbol: 'BTCUSDT',
          type: CHANNEL.ORDERBOOK,
          exchangeType: 'spot'
        })
      );
      expect(mockSocket.on).toHaveBeenCalledWith(CHANNEL.ORDERBOOK, expect.any(Function));
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('オーダーブック購読開始'),
        expect.objectContaining({
          component: 'SubscriptionManager',
          action: 'subscribeOrderBook',
          symbol: 'BTCUSDT',
          exchangeType: 'spot'
        })
      );
      
      // イベントハンドラを取得
      const handler = mockSocket.on.mock.calls.find(
        (call) => call[0] === CHANNEL.ORDERBOOK
      )[1];
      
      // オーダーブックデータを作成
      const orderBookData = {
        symbol: 'BTCUSDT',
        exchangeType: 'spot',
        timestamp: Date.now(),
        data: {
          asks: [['50000', '1.5'], ['50100', '2.0']],
          bids: [['49900', '1.0'], ['49800', '2.5']]
        }
      };
      
      // ハンドラを呼び出し
      handler(orderBookData);
      
      // コールバックが呼ばれたことを確認
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        symbol: 'BTCUSDT',
        timestamp: orderBookData.timestamp,
        asks: expect.arrayContaining([
          expect.objectContaining({ price: 50000, amount: 1.5 }),
          expect.objectContaining({ price: 50100, amount: 2.0 })
        ]),
        bids: expect.arrayContaining([
          expect.objectContaining({ price: 49900, amount: 1.0 }),
          expect.objectContaining({ price: 49800, amount: 2.5 })
        ])
      }));
      
      // 購読解除を実行
      unsubscribe();
      
      // 購読解除が正しく行われたことを確認
      expect(mockSocket.off).toHaveBeenCalledWith(CHANNEL.ORDERBOOK, handler);
      expect(mockSocket.emit).toHaveBeenCalledWith(
        CHANNEL.UNSUBSCRIBE,
        expect.objectContaining({
          symbol: 'BTCUSDT',
          type: CHANNEL.ORDERBOOK,
          exchangeType: 'spot'
        })
      );
    });
    
    it('購読中にエラーが発生した場合はログを出力すること', () => {
      // mockSocket.emitでエラーを発生させる
      mockSocket.emit.mockImplementationOnce(() => {
        throw new Error('購読エラー');
      });
      
      // subscribeOrderBookを実行
      const unsubscribe = subscriptionManager.subscribeOrderBook('BTC/USDT', jest.fn());
      
      // 結果を検証
      expect(unsubscribe).toBeInstanceOf(Function);
      expect(logger.error).toHaveBeenCalledWith(
        'オーダーブック購読エラー:',
        expect.any(Error),
        expect.objectContaining({
          component: 'SubscriptionManager',
          action: 'subscribeOrderBook',
          symbol: 'BTC/USDT',
          exchangeType: 'spot',
          error: expect.any(Error)
        })
      );
    });
  });
  
  describe('subscribeKline', () => {
    it('ソケットが初期化されていない場合は空の関数を返すこと', () => {
      // getSocketの戻り値をnullに設定
      (mockWebSocketClient.getSocket as jest.Mock).mockReturnValueOnce(null);
      
      // subscribeKlineを実行
      const unsubscribe = subscriptionManager.subscribeKline('BTC/USDT', '1m', jest.fn());
      
      // 結果を検証
      expect(unsubscribe).toBeInstanceOf(Function);
      expect(logger.error).toHaveBeenCalledWith(
        'ソケットが初期化されていません',
        expect.objectContaining({
          component: 'SubscriptionManager',
          action: 'subscribeKline'
        })
      );
    });
    
    it('正常に購読できること', () => {
      // コールバック関数
      const callback = jest.fn();
      
      // subscribeKlineを実行
      const unsubscribe = subscriptionManager.subscribeKline('BTC/USDT', '1m', callback);
      
      // 結果を検証
      expect(unsubscribe).toBeInstanceOf(Function);
      expect(mockSocket.emit).toHaveBeenCalledWith(
        CHANNEL.SUBSCRIBE,
        expect.objectContaining({
          symbol: 'BTCUSDT',
          type: CHANNEL.KLINE,
          timeframe: '1m',
          exchangeType: 'spot'
        })
      );
      expect(mockSocket.on).toHaveBeenCalledWith(CHANNEL.KLINE, expect.any(Function));
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('ローソク足購読開始'),
        expect.objectContaining({
          component: 'SubscriptionManager',
          action: 'subscribeKline',
          symbol: 'BTCUSDT',
          timeframe: '1m',
          exchangeType: 'spot'
        })
      );
      
      // イベントハンドラを取得
      const handler = mockSocket.on.mock.calls.find(
        (call) => call[0] === CHANNEL.KLINE
      )[1];
      
      // ローソク足データを作成
      const klineData = {
        symbol: 'BTCUSDT',
        timeframe: '1m',
        exchangeType: 'spot',
        timestamp: Date.now(),
        data: {
          open: '50000',
          high: '50100',
          low: '49900',
          close: '50050',
          volume: '100'
        }
      };
      
      // ハンドラを呼び出し
      handler(klineData);
      
      // コールバックが呼ばれたことを確認
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        symbol: 'BTCUSDT',
        timestamp: klineData.timestamp,
        open: 50000,
        high: 50100,
        low: 49900,
        close: 50050,
        volume: 100,
        timeframe: '1m'
      }));
      
      // 購読解除を実行
      unsubscribe();
      
      // 購読解除が正しく行われたことを確認
      expect(mockSocket.off).toHaveBeenCalledWith(CHANNEL.KLINE, handler);
      expect(mockSocket.emit).toHaveBeenCalledWith(
        CHANNEL.UNSUBSCRIBE,
        expect.objectContaining({
          symbol: 'BTCUSDT',
          type: CHANNEL.KLINE,
          timeframe: '1m',
          exchangeType: 'spot'
        })
      );
    });
  });
  
  describe('unsubscribeAll', () => {
    it('すべての購読を解除できること', () => {
      // 購読を追加
      subscriptionManager.subscribeOrderBook('BTC/USDT', jest.fn());
      subscriptionManager.subscribeKline('BTC/USDT', '1m', jest.fn());
      
      // モックをリセット
      mockSocket.off.mockClear();
      mockSocket.emit.mockClear();
      
      // unsubscribeAllを実行
      subscriptionManager.unsubscribeAll();
      
      // 結果を検証
      expect(mockSocket.off).toHaveBeenCalledTimes(2);
      expect(mockSocket.emit).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenCalledWith(
        'すべての購読を解除しました',
        expect.objectContaining({
          component: 'SubscriptionManager',
          action: 'unsubscribeAll'
        })
      );
    });
    
    it('ソケットが初期化されていない場合はログを出力すること', () => {
      // getSocketの戻り値をnullに設定
      (mockWebSocketClient.getSocket as jest.Mock).mockReturnValueOnce(null);
      
      // unsubscribeAllを実行
      subscriptionManager.unsubscribeAll();
      
      // 結果を検証
      expect(logger.error).toHaveBeenCalledWith(
        'ソケットが初期化されていません',
        expect.objectContaining({
          component: 'SubscriptionManager',
          action: 'unsubscribeAll'
        })
      );
    });
  });
  
  describe('resubscribeAll', () => {
    it('すべての購読を再購読できること', () => {
      // 購読を追加
      subscriptionManager.subscribeOrderBook('BTC/USDT', jest.fn());
      subscriptionManager.subscribeKline('BTC/USDT', '1m', jest.fn());
      
      // モックをリセット
      mockSocket.on.mockClear();
      mockSocket.emit.mockClear();
      
      // resubscribeAllを実行
      subscriptionManager.resubscribeAll();
      
      // 結果を検証
      expect(mockSocket.on).toHaveBeenCalledTimes(2);
      expect(mockSocket.emit).toHaveBeenCalledTimes(4); // unsubscribe + subscribe
      expect(logger.info).toHaveBeenCalledWith(
        'すべての購読を再購読しました',
        expect.objectContaining({
          component: 'SubscriptionManager',
          action: 'resubscribeAll',
          count: 2
        })
      );
    });
    
    it('ソケットが初期化されていない場合はログを出力すること', () => {
      // getSocketの戻り値をnullに設定
      (mockWebSocketClient.getSocket as jest.Mock).mockReturnValueOnce(null);
      
      // resubscribeAllを実行
      subscriptionManager.resubscribeAll();
      
      // 結果を検証
      expect(logger.error).toHaveBeenCalledWith(
        'ソケットが初期化されていません',
        expect.objectContaining({
          component: 'SubscriptionManager',
          action: 'resubscribeAll'
        })
      );
    });
  });
});
