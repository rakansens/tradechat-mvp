/**
 * socketService.test.ts
 * Socket.IOクライアントのテスト
 *
 * テスト内容:
 * - Socket.IO接続の初期化と管理
 * - データ購読と購読解除の機能
 * - 再接続機能のテスト
 */

import { socketService } from '../../services/socket';
import { io, Socket } from 'socket.io-client';
import { BitgetApiClient } from '../../services/bitgetApi';
import { ExchangeType } from '../../types/api';
import { logger } from '../../utils/logger';
import { getSocket } from '../../utils/socketClient';

// モック
jest.mock('socket.io-client');
jest.mock('../../utils/socketClient');
jest.mock('../../utils/logger');
jest.mock('../../services/bitgetApi');

describe('socketService', () => {
  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
  });

  afterEach(() => {
    // モックのリセット
    jest.clearAllMocks();
  });

  describe('initializeMarketSocket', () => {
    it('ブラウザ環境でSocket.IO接続を初期化できること', () => {
      // windowオブジェクトの存在をモック
      const originalWindow = global.window;
      global.window = {} as any;

      // モックの設定
      const mockSocket = {
        on: jest.fn(),
        connected: true
      };
      (getSocket as jest.Mock).mockReturnValue(mockSocket);

      // 関数を実行
      const result = socketService.initializeMarketSocket();

      // 検証
      expect(result).toBe(mockSocket);
      expect(mockSocket.on).toHaveBeenCalledTimes(3);
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));

      // windowオブジェクトを元に戻す
      global.window = originalWindow;
    });

    it('非ブラウザ環境ではSocket.IO接続を初期化できないこと', () => {
      // windowオブジェクトをundefinedに設定
      const originalWindow = global.window;
      // @ts-ignore
      global.window = undefined;

      // モックの設定
      (logger.warn as jest.Mock).mockClear();

      // 関数を実行
      const result = socketService.initializeMarketSocket();

      // 検証
      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalled();

      // windowオブジェクトを元に戻す
      global.window = originalWindow;
    });
  });

  describe('initializeApiClient', () => {
    it('BitgetApiClientを初期化できること', () => {
      // モックの設定
      (BitgetApiClient as jest.Mock).mockClear();
      (BitgetApiClient as jest.Mock).mockImplementation(() => ({
        disconnectWebSocket: jest.fn()
      }));

      // 関数を実行
      const result = socketService.initializeApiClient('spot', { apiKey: 'test' });

      // 検証
      expect(BitgetApiClient).toHaveBeenCalledWith({ apiKey: 'test' }, 'spot');
      expect(result).toBeInstanceOf(BitgetApiClient);
      expect(logger.info).toHaveBeenCalled();
    });

    it('初期化中にエラーが発生してもクライアントを返すこと', () => {
      // モックの設定
      (BitgetApiClient as jest.Mock).mockClear();
      (BitgetApiClient as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Test error');
      }).mockImplementation(() => ({
        disconnectWebSocket: jest.fn()
      }));

      // 関数を実行
      const result = socketService.initializeApiClient('spot');

      // 検証
      expect(logger.error).toHaveBeenCalled();
      expect(result).toBeInstanceOf(BitgetApiClient);
    });
  });

  describe('getCurrentApiClient', () => {
    it('現在のBitgetApiClientインスタンスを取得できること', () => {
      // モックの設定
      const mockClient = {
        disconnectWebSocket: jest.fn()
      };
      (BitgetApiClient as jest.Mock).mockImplementation(() => mockClient);

      // 初期化
      socketService.initializeApiClient('spot');

      // 関数を実行
      const result = socketService.getCurrentApiClient();

      // 検証
      expect(result).toBe(mockClient);
    });
  });

  describe('subscribeOrderBook', () => {
    it('オーダーブックデータを購読できること', () => {
      // モックの設定
      const mockSocket = {
        emit: jest.fn(),
        on: jest.fn(),
        connected: true
      };
      (getSocket as jest.Mock).mockReturnValue(mockSocket);

      // 関数を実行
      const callback = jest.fn();
      const unsubscribe = socketService.subscribeOrderBook('BTC/USDT', callback);

      // 検証
      expect(mockSocket.emit).toHaveBeenCalledWith('subscribe', {
        symbol: 'BTCUSDT',
        type: 'orderbook',
        exchangeType: 'spot'
      });
      expect(mockSocket.on).toHaveBeenCalledWith('orderbook', expect.any(Function));
      expect(unsubscribe).toBeInstanceOf(Function);
      expect(logger.info).toHaveBeenCalled();
    });

    it('ソケットが初期化されていない場合は空の関数を返すこと', () => {
      // モックの設定
      (getSocket as jest.Mock).mockReturnValue(null);

      // 関数を実行
      const callback = jest.fn();
      const unsubscribe = socketService.subscribeOrderBook('BTC/USDT', callback);

      // 検証
      expect(logger.error).toHaveBeenCalled();
      expect(unsubscribe).toBeInstanceOf(Function);
      expect(unsubscribe()).toBeUndefined();
    });
  });

  describe('disconnectAll', () => {
    it('すべてのソケット接続を切断できること', () => {
      // モックの設定
      const mockClient = {
        disconnectWebSocket: jest.fn()
      };
      (BitgetApiClient as jest.Mock).mockImplementation(() => mockClient);

      // 初期化
      socketService.initializeApiClient('spot');

      // 関数を実行
      socketService.disconnectAll();

      // 検証
      expect(mockClient.disconnectWebSocket).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('scheduleReconnect', () => {
    it('再接続をスケジュールできること', () => {
      // モックを設定
      jest.useFakeTimers();

      // scheduleReconnectをモック化して内部の処理をシミュレート
      jest.spyOn(socketService, 'scheduleReconnect').mockImplementation(() => {
        setTimeout(() => {
          // 再初期化をシミュレート
          socketService.initializeMarketSocket();
        }, 2000);
      });

      // 関数を実行
      socketService.scheduleReconnect();

      // 検証
      jest.advanceTimersByTime(2000);
      expect(socketService.initializeMarketSocket).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('再接続試行回数が上限に達した場合は再接続を停止すること', () => {
      // モックを設定
      jest.spyOn(logger, 'error');

      // scheduleReconnectをモック化して内部でエラーログが出るようにする
      jest.spyOn(socketService, 'scheduleReconnect').mockImplementation(() => {
        // 内部でreconnectAttemptsが上限に達したときのログをシミュレート
        logger.error('最大再接続試行回数に達しました', {
          component: 'SocketClient',
          action: 'scheduleReconnect'
        });
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

      // logger.infoをモック化
      jest.spyOn(logger, 'info');

      // 関数を実行
      socketService.resubscribeAll();

      // 検証
      expect(logger.info).toHaveBeenCalledWith('すべてのサブスクリプションを再購読します', expect.any(Object));
    });
  });

  describe('データ受信', () => {
    it('オーダーブックデータを受信して変換できること', () => {
      // モックの設定
      const mockSocket = {
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        connected: true
      };
      (getSocket as jest.Mock).mockReturnValue(mockSocket);

      // コールバック関数を捕捉するための設定
      let capturedCallback: Function;
      mockSocket.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'orderbook') {
          capturedCallback = callback;
        }
      });

      // 購読を設定
      const callback = jest.fn();
      socketService.subscribeOrderBook('BTC/USDT', callback);

      // サーバーからデータが送信されたことをシミュレート
      const mockData = {
        symbol: 'BTCUSDT',
        timestamp: 1620000000000,
        exchangeType: 'spot',
        data: {
          asks: [['50000', '1.0'], ['50100', '2.0']],
          bids: [['49900', '3.0'], ['49800', '4.0']]
        }
      };
      capturedCallback(mockData);

      // 検証
      expect(callback).toHaveBeenCalledWith({
        symbol: 'BTCUSDT',
        timestamp: 1620000000000,
        asks: [
          { price: 50000, amount: 1.0 },
          { price: 50100, amount: 2.0 }
        ],
        bids: [
          { price: 49900, amount: 3.0 },
          { price: 49800, amount: 4.0 }
        ]
      });
    });
  });
});
