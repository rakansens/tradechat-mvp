/**
 * __tests__/services/socket/socket-service.test.ts
 * SocketServiceクラスのテスト
 * 
 * 作成: 2025-05-12 - WebSocketサービスのリファクタリングに伴い新規作成
 */

import { Socket } from 'socket.io-client';
import { SocketService } from '../../../services/socket/socket-service';
import { IWebSocketClient, ISubscriptionManager, IBitgetIntegration } from '../../../services/socket/interfaces';
import { OrderBookData } from '../../../types/market';
import { OHLCData } from '../../../types/chart';
import { ProductType } from '@/types/api';
import { BitgetApiClient } from '../../../services/api/bitget/client';
import { logger } from '../../../utils/logger';

// モック
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connected: true
};

// WebSocketClientモック
const mockWebSocketClient: IWebSocketClient = {
  initialize: jest.fn().mockReturnValue(mockSocket),
  getSocket: jest.fn().mockReturnValue(mockSocket),
  isConnected: jest.fn().mockReturnValue(true),
  disconnect: jest.fn(),
  scheduleReconnect: jest.fn()
};

// SubscriptionManagerモック
const mockSubscriptionManager: ISubscriptionManager = {
  subscribeOrderBook: jest.fn().mockReturnValue(() => {}),
  subscribeKline: jest.fn().mockReturnValue(() => {}),
  subscribeTrades: jest.fn().mockReturnValue(() => {}),
  unsubscribeAll: jest.fn(),
  resubscribeAll: jest.fn()
};

// BitgetApiClientモック
const mockBitgetApiClient = {
  disconnectWebSocket: jest.fn(),
  fetchCandles: jest.fn(),
  fetchOrderBook: jest.fn(),
  subscribeToCandles: jest.fn(),
  subscribeToOrderBook: jest.fn()
};

// BitgetIntegrationモック
const mockBitgetIntegration: IBitgetIntegration = {
  initializeApiClient: jest.fn().mockReturnValue(mockBitgetApiClient),
  getCurrentApiClient: jest.fn().mockReturnValue(mockBitgetApiClient),
  disconnectApiClient: jest.fn()
};

jest.mock('../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('SocketService', () => {
  let socketService: SocketService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // SocketServiceインスタンスを作成
    socketService = new SocketService(
      mockWebSocketClient,
      mockSubscriptionManager,
      mockBitgetIntegration
    );
  });
  
  describe('constructor', () => {
    it('依存コンポーネントを正しく設定すること', () => {
      // 結果を検証
      expect(logger.info).toHaveBeenCalledWith(
        'SocketServiceインスタンスを作成',
        expect.objectContaining({
          component: 'SocketService',
          action: 'constructor'
        })
      );
    });
  });
  
  describe('initializeMarketSocket', () => {
    it('WebSocketClientのinitializeを呼び出すこと', () => {
      // initializeMarketSocketを実行
      const result = socketService.initializeMarketSocket();
      
      // 結果を検証
      expect(mockWebSocketClient.initialize).toHaveBeenCalled();
      expect(result).toBe(mockSocket);
    });
  });
  
  describe('initializeApiClient', () => {
    it('BitgetIntegrationのinitializeApiClientを呼び出すこと', () => {
      // initializeApiClientを実行
      const result = socketService.initializeApiClient('spot' as ProductType);
      
      // 結果を検証
      expect(mockBitgetIntegration.initializeApiClient).toHaveBeenCalledWith('spot', {});
      expect(result).toBe(mockBitgetApiClient);
    });
    
    it('設定オプションを正しく渡すこと', () => {
      // 設定オプション
      const config = { demo: true, reconnect: false };
      
      // initializeApiClientを実行
      socketService.initializeApiClient('futures' as ProductType, config);
      
      // 結果を検証
      expect(mockBitgetIntegration.initializeApiClient).toHaveBeenCalledWith('futures', config);
    });
  });
  
  describe('getCurrentApiClient', () => {
    it('BitgetIntegrationのgetCurrentApiClientを呼び出すこと', () => {
      // getCurrentApiClientを実行
      const result = socketService.getCurrentApiClient();
      
      // 結果を検証
      expect(mockBitgetIntegration.getCurrentApiClient).toHaveBeenCalled();
      expect(result).toBe(mockBitgetApiClient);
    });
  });
  
  describe('subscribeOrderBook', () => {
    it('SubscriptionManagerのsubscribeOrderBookを呼び出すこと', () => {
      // コールバック関数
      const callback = jest.fn();
      
      // subscribeOrderBookを実行
      const unsubscribe = socketService.subscribeOrderBook('BTC/USDT', callback);
      
      // 結果を検証
      expect(mockSubscriptionManager.subscribeOrderBook).toHaveBeenCalledWith(
        'BTC/USDT',
        callback,
        'spot'
      );
      expect(unsubscribe).toBeInstanceOf(Function);
    });
    
    it('exchangeTypeを正しく渡すこと', () => {
      // コールバック関数
      const callback = jest.fn();
      
      // subscribeOrderBookを実行
      socketService.subscribeOrderBook('BTC/USDT', callback, 'futures' as ProductType);
      
      // 結果を検証
      expect(mockSubscriptionManager.subscribeOrderBook).toHaveBeenCalledWith(
        'BTC/USDT',
        callback,
        'futures'
      );
    });
  });
  
  describe('subscribeKline', () => {
    it('SubscriptionManagerのsubscribeKlineを呼び出すこと', () => {
      // コールバック関数
      const callback = jest.fn();
      
      // subscribeKlineを実行
      const unsubscribe = socketService.subscribeKline('BTC/USDT', '1m', callback);
      
      // 結果を検証
      expect(mockSubscriptionManager.subscribeKline).toHaveBeenCalledWith(
        'BTC/USDT',
        '1m',
        callback,
        'spot'
      );
      expect(unsubscribe).toBeInstanceOf(Function);
    });
    
    it('exchangeTypeを正しく渡すこと', () => {
      // コールバック関数
      const callback = jest.fn();
      
      // subscribeKlineを実行
      socketService.subscribeKline('BTC/USDT', '1m', callback, 'futures' as ProductType);
      
      // 結果を検証
      expect(mockSubscriptionManager.subscribeKline).toHaveBeenCalledWith(
        'BTC/USDT',
        '1m',
        callback,
        'futures'
      );
    });
  });
  
  describe('disconnectAll', () => {
    it('すべての接続を切断すること', () => {
      // disconnectAllを実行
      socketService.disconnectAll();
      
      // 結果を検証
      expect(mockWebSocketClient.disconnect).toHaveBeenCalled();
      expect(mockBitgetIntegration.disconnectApiClient).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'すべての接続を切断しました',
        expect.objectContaining({
          component: 'SocketService',
          action: 'disconnectAll'
        })
      );
    });
    
    it('切断中にエラーが発生した場合はログを出力すること', () => {
      // disconnectでエラーを発生させる
      (mockWebSocketClient.disconnect as jest.Mock).mockImplementation(() => {
        throw new Error('切断エラー');
      });
      
      // disconnectAllを実行
      socketService.disconnectAll();
      
      // 結果を検証
      expect(logger.error).toHaveBeenCalledWith(
        '接続切断エラー:',
        expect.any(Error),
        expect.objectContaining({
          component: 'SocketService',
          action: 'disconnectAll',
          error: expect.any(Error)
        })
      );
    });
  });
  
  describe('scheduleReconnect', () => {
    it('WebSocketClientのscheduleReconnectを呼び出すこと', () => {
      // scheduleReconnectを実行
      socketService.scheduleReconnect();
      
      // 結果を検証
      expect(mockWebSocketClient.scheduleReconnect).toHaveBeenCalled();
    });
  });
  
  describe('resubscribeAll', () => {
    it('SubscriptionManagerのresubscribeAllを呼び出すこと', () => {
      // resubscribeAllを実行
      socketService.resubscribeAll();
      
      // 結果を検証
      expect(mockSubscriptionManager.resubscribeAll).toHaveBeenCalled();
    });
  });
});
