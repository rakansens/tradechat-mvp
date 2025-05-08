/**
 * __tests__/services/socketService.test.ts
 * socketServiceのテスト実装
 * 
 * WebSocketの共有データ方式のテストを実装
 * - Socket.IO接続の初期化と管理のテスト
 * - 各種データ購読メソッドのテスト
 * - エラーハンドリングとフォールバック機能のテスト
 * - 再接続機能のテスト
 */

import { socketService } from '../../services/socketService';
import { io, Socket } from 'socket.io-client';
import { BitgetApiClient } from '../../services/bitgetApi';
import { ExchangeType } from '../../types/api';
import { OrderBookData } from '../../types/market';
import { OHLCData } from '../../types/chart';

// Socket.io-clientとBitgetApiClientをモック化
jest.mock('socket.io-client');
jest.mock('../../services/bitgetApi');
jest.mock('../../utils/socketClient', () => ({
  initializeSocketClient: jest.fn(),
  getSocket: jest.fn(),
  emitEvent: jest.fn()
}));
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// モックのインポート
import { initializeSocketClient, getSocket, emitEvent } from '../../utils/socketClient';
import { logger } from '../../utils/logger';

describe('socketService', () => {
  // テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
    
    // windowオブジェクトのモック
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true
    });
  });

  describe('initializeMarketSocket', () => {
    it('ブラウザ環境でSocket.IO接続を初期化できること', () => {
      // モックの設定
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        off: jest.fn()
      };
      (getSocket as jest.Mock).mockReturnValue(mockSocket);
      
      // 関数を実行
      const result = socketService.initializeMarketSocket();
      
      // 検証
      expect(initializeSocketClient).toHaveBeenCalledWith(false, '/market');
      expect(getSocket).toHaveBeenCalledWith(true, '/market');
      expect(result).toBe(mockSocket);
      
      // イベントリスナーが設定されていることを確認
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });
    
    it('ブラウザ環境でない場合はnullを返すこと', () => {
      // windowオブジェクトをundefinedに設定
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true
      });
      
      // 関数を実行
      const result = socketService.initializeMarketSocket();
      
      // 検証
      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalled();
    });
    
    it('エラーが発生した場合はnullを返すこと', () => {
      // モックの設定
      (initializeSocketClient as jest.Mock).mockImplementation(() => {
        throw new Error('初期化エラー');
      });
      
      // 関数を実行
      const result = socketService.initializeMarketSocket();
      
      // 検証
      expect(result).toBeNull();
      expect(logger.error).toHaveBeenCalled();
    });
  });
  
  describe('subscribeOrderBook', () => {
    it('オーダーブックデータを購読できること', () => {
      // モックの設定
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        off: jest.fn()
      };
      (getSocket as jest.Mock).mockReturnValue(mockSocket);
      
      // コールバック関数
      const callback = jest.fn();
      
      // 関数を実行
      const unsubscribe = socketService.subscribeOrderBook('BTC/USDT', callback);
      
      // 検証
      expect(mockSocket.emit).toHaveBeenCalledWith('subscribe', {
        symbol: 'BTCUSDT',
        type: 'orderbook',
        exchangeType: 'spot'
      });
      expect(mockSocket.on).toHaveBeenCalledWith('orderbook', expect.any(Function));
      
      // 購読解除関数が返されることを確認
      expect(typeof unsubscribe).toBe('function');
    });
    
    it('Socket.IOが初期化されていない場合は初期化を試みること', () => {
      // モックの設定
      (getSocket as jest.Mock).mockReturnValueOnce(null).mockReturnValueOnce({
        on: jest.fn(),
        emit: jest.fn(),
        off: jest.fn()
      });
      
      // コールバック関数
      const callback = jest.fn();
      
      // 関数を実行
      socketService.subscribeOrderBook('BTC/USDT', callback);
      
      // 検証
      expect(initializeSocketClient).toHaveBeenCalled();
    });
    
    it('エラーが発生した場合は空の関数を返すこと', () => {
      // モックの設定
      (getSocket as jest.Mock).mockImplementation(() => {
        throw new Error('購読エラー');
      });
      
      // コールバック関数
      const callback = jest.fn();
      
      // 関数を実行
      const unsubscribe = socketService.subscribeOrderBook('BTC/USDT', callback);
      
      // 検証
      expect(logger.error).toHaveBeenCalled();
      expect(typeof unsubscribe).toBe('function');
    });
  });
  
  describe('subscribeKline', () => {
    it('ローソク足データを購読できること', () => {
      // モックの設定
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        off: jest.fn()
      };
      (getSocket as jest.Mock).mockReturnValue(mockSocket);
      
      // コールバック関数
      const callback = jest.fn();
      
      // 関数を実行
      const unsubscribe = socketService.subscribeKline('BTC/USDT', '1m', callback);
      
      // 検証
      expect(mockSocket.emit).toHaveBeenCalledWith('subscribe', {
        symbol: 'BTCUSDT',
        type: 'kline',
        timeframe: '1m',
        exchangeType: 'spot'
      });
      expect(mockSocket.on).toHaveBeenCalledWith('kline', expect.any(Function));
      
      // 購読解除関数が返されることを確認
      expect(typeof unsubscribe).toBe('function');
    });
  });
  
  describe('subscribeTrade', () => {
    it('取引データを購読できること', () => {
      // モックの設定
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        off: jest.fn()
      };
      (getSocket as jest.Mock).mockReturnValue(mockSocket);
      
      // コールバック関数
      const callback = jest.fn();
      
      // 関数を実行
      const unsubscribe = socketService.subscribeTrade('BTC/USDT', callback);
      
      // 検証
      expect(mockSocket.emit).toHaveBeenCalledWith('subscribe', {
        symbol: 'BTCUSDT',
        type: 'trade',
        exchangeType: 'spot'
      });
      expect(mockSocket.on).toHaveBeenCalledWith('trade', expect.any(Function));
      
      // 購読解除関数が返されることを確認
      expect(typeof unsubscribe).toBe('function');
    });
  });
  
  describe('disconnectAll', () => {
    it('すべてのソケット接続を切断できること', () => {
      // モックの設定
      const mockBitgetApi = {
        disconnectWebSocket: jest.fn()
      };
      (BitgetApiClient as jest.Mock).mockReturnValue(mockBitgetApi);
      
      // 関数を実行
      socketService.disconnectAll();
      
      // 検証
      expect(mockBitgetApi.disconnectWebSocket).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
    });
    
    it('エラーが発生した場合もログを出力すること', () => {
      // モックの設定
      (BitgetApiClient as jest.Mock).mockImplementation(() => {
        throw new Error('切断エラー');
      });
      
      // 関数を実行
      socketService.disconnectAll();
      
      // 検証
      expect(logger.error).toHaveBeenCalled();
    });
  });
  
  describe('emitTimeframeChange', () => {
    it('時間足変更イベントを発行できること', async () => {
      // モックの設定
      const mockSocket = {
        connected: true
      };
      (getSocket as jest.Mock).mockReturnValue(mockSocket);
      (emitEvent as jest.Mock).mockImplementation((event, data, callback) => {
        callback({ success: true });
      });
      
      // 関数を実行
      const result = await socketService.emitTimeframeChange('1h');
      
      // 検証
      expect(emitEvent).toHaveBeenCalledWith('changeTimeframe', { timeframe: '1h' }, expect.any(Function));
      expect(result).toBe(true);
    });
    
    it('ソケットが接続されていない場合はfalseを返すこと', async () => {
      // モックの設定
      (getSocket as jest.Mock).mockReturnValue(null);
      
      // 関数を実行
      const result = await socketService.emitTimeframeChange('1h');
      
      // 検証
      expect(result).toBe(false);
      expect(logger.warn).toHaveBeenCalled();
    });
  });
  
  describe('emitSymbolChange', () => {
    it('銘柄変更イベントを発行できること', async () => {
      // モックの設定
      const mockSocket = {
        connected: true
      };
      (getSocket as jest.Mock).mockReturnValue(mockSocket);
      (emitEvent as jest.Mock).mockImplementation((event, data, callback) => {
        callback({ success: true });
      });
      
      // 関数を実行
      const result = await socketService.emitSymbolChange('ETH/USDT');
      
      // 検証
      expect(emitEvent).toHaveBeenCalledWith('changeSymbol', { symbol: 'ETH/USDT' }, expect.any(Function));
      expect(result).toBe(true);
    });
  });
  
  describe('isConnected', () => {
    it('接続状態を返すこと', () => {
      // モックの設定
      const mockSocket = { connected: true };
      (getSocket as jest.Mock).mockReturnValue(mockSocket);
      const result = socketService.isConnected();
      expect(result).toBe(true);
    });
    
    it('接続されていない場合はfalseを返すこと', () => {
      // モックの設定
      const mockSocket = { connected: false };
      (getSocket as jest.Mock).mockReturnValue(mockSocket);
      const result = socketService.isConnected();
      expect(result).toBe(false);
    });
  });
  
  describe('scheduleReconnect', () => {
    it('再接続をスケジュールできること', () => {
      // タイマーをモック
      jest.useFakeTimers();
      
      // 関数を実行
      socketService.scheduleReconnect();
      
      // 検証
      expect(setTimeout).toHaveBeenCalled();
      
      // タイマーを進める
      jest.runAllTimers();
      
      // 再接続が試行されることを確認
      expect(initializeSocketClient).toHaveBeenCalled();
      
      // タイマーをリセット
      jest.useRealTimers();
    });
    
    it('再接続試行回数が上限に達した場合は再接続を停止すること', () => {
      // 内部状態を設定
      Object.defineProperty(socketService, 'reconnectAttempts', {
        value: 5,
        writable: true
      });
      
      Object.defineProperty(socketService, 'MAX_RECONNECT_ATTEMPTS', {
        value: 5,
        writable: true
      });
      
      // 関数を実行
      socketService.scheduleReconnect();
      
      // 検証
      expect(logger.error).toHaveBeenCalled();
    });
  });
  
  describe('resubscribeAll', () => {
    it('すべてのサブスクリプションを再購読できること', () => {
      // モックの設定
      const mockSocket = {
        emit: jest.fn()
      };
      (getSocket as jest.Mock).mockReturnValue(mockSocket);
      
      // 内部状態を設定
      const activeSubscriptions = new Map([
        ['orderbook:BTCUSDT:spot', new Set([() => {}])],
        ['kline:ETHUSDT:1h:spot', new Set([() => {}])]
      ]);
      
      Object.defineProperty(socketService, 'activeSubscriptions', {
        value: activeSubscriptions,
        writable: true
      });
      
      // 関数を実行
      socketService.resubscribeAll();
      
      // 検証
      expect(mockSocket.emit).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenCalled();
    });
  });
  
  // データ受信のテスト
  describe('データ受信', () => {
    it('オーダーブックデータを受信して変換できること', () => {
      // モックの設定
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        off: jest.fn()
      };
      (getSocket as jest.Mock).mockReturnValue(mockSocket);
      
      // コールバック関数
      const callback = jest.fn();
      
      // 関数を実行
      socketService.subscribeOrderBook('BTC/USDT', callback);
      
      // onメソッドの第2引数（ハンドラ関数）を取得
      const orderbookOnCall = mockSocket.on.mock.calls.find(([event]) => event === 'orderbook');
      expect(orderbookOnCall).toBeDefined();
      const handler = (orderbookOnCall as any)[1];
      
      // ハンドラ関数を呼び出してデータを受信
      handler({
        symbol: 'BTC/USDT',
        exchangeType: 'spot',
        data: {
          asks: [['50000', '1.5'], ['50100', '2.0']],
          bids: [['49900', '1.0'], ['49800', '2.5']],
          timestamp: 1620000000000
        },
        timestamp: 1620000000000
      });
      
      // 検証
      expect(callback).toHaveBeenCalledWith({
        symbol: 'BTC/USDT',
        timestamp: 1620000000000,
        asks: [
          { price: 50000, amount: 1.5 },
          { price: 50100, amount: 2.0 }
        ],
        bids: [
          { price: 49900, amount: 1.0 },
          { price: 49800, amount: 2.5 }
        ]
      });
    });
    
    it('ローソク足データを受信して変換できること', () => {
      // モックの設定
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        off: jest.fn()
      };
      (getSocket as jest.Mock).mockReturnValue(mockSocket);
      
      // コールバック関数
      const callback = jest.fn();
      
      // 関数を実行
      socketService.subscribeKline('BTC/USDT', '1m', callback);
      
      // onメソッドの第2引数（ハンドラ関数）を取得
      const klineOnCall = mockSocket.on.mock.calls.find(([event]) => event === 'kline');
      expect(klineOnCall).toBeDefined();
      const handler = (klineOnCall as any)[1];
      
      // ハンドラ関数を呼び出してデータを受信
      handler({
        symbol: 'BTC/USDT',
        timeframe: '1m',
        exchangeType: 'spot',
        data: {
          time: 1620000000000,
          open: 50000,
          high: 50100,
          low: 49900,
          close: 50050,
          volume: 10.5
        },
        timestamp: 1620000000000
      });
      
      // 検証
      expect(callback).toHaveBeenCalledWith({
        time: 1620000000000,
        open: 50000,
        high: 50100,
        low: 49900,
        close: 50050,
        volume: 10.5
      });
    });
  });
});