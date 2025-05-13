/**
 * __tests__/server/bitgetWebSocketManager.test.ts
 * BitgetWebSocketManagerのテスト実装
 * 
 * WebSocketマネージャーの機能をテスト
 * - WebSocket接続の初期化と管理
 * - サブスクリプション管理
 * - メッセージハンドリング
 * - 再接続機能
 * - エラーハンドリング
 */

import { BitgetWebSocketManager } from '../../server/bitgetWebSocketManager';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { logger } from '../../utils/common';

// WebSocketとloggerをモック化
jest.mock('ws');
jest.mock('../../utils/common', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('BitgetWebSocketManager', () => {
  let wsManager: BitgetWebSocketManager;
  let mockWs: any;
  
  // テスト前の準備
  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();
    
    // WebSocketのモックを設定
    mockWs = {
      on: jest.fn(),
      send: jest.fn(),
      terminate: jest.fn(),
      readyState: WebSocket.OPEN
    };
    (WebSocket as jest.Mock).mockImplementation(() => mockWs);
    
    // BitgetWebSocketManagerのインスタンスを作成
    wsManager = new BitgetWebSocketManager('wss://test.example.com');
  });
  
  describe('connect', () => {
    it('WebSocket接続を初期化できること', () => {
      // 接続を開始
      wsManager.connect();
      
      // WebSocketが作成されたことを確認
      expect(WebSocket).toHaveBeenCalledWith('wss://test.example.com');
      
      // イベントリスナーが設定されたことを確認
      expect(mockWs.on).toHaveBeenCalledWith('open', expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith('close', expect.any(Function));
      
      // ログが出力されたことを確認
      expect(logger.info).toHaveBeenCalled();
    });
    
    it('既に接続中の場合は何もしないこと', () => {
      // 内部状態を設定
      (wsManager as any).connectionState = 'connected';
      
      // 接続を開始
      wsManager.connect();
      
      // WebSocketが作成されていないことを確認
      expect(WebSocket).not.toHaveBeenCalled();
      
      // ログが出力されたことを確認
      expect(logger.info).toHaveBeenCalled();
    });
    
    it('接続中の場合は何もしないこと', () => {
      // 内部状態を設定
      (wsManager as any).connectionState = 'connecting';
      
      // 接続を開始
      wsManager.connect();
      
      // WebSocketが作成されていないことを確認
      expect(WebSocket).not.toHaveBeenCalled();
      
      // ログが出力されたことを確認
      expect(logger.info).toHaveBeenCalled();
    });
    
    it('エラーが発生した場合は再接続をスケジュールすること', () => {
      // WebSocketのモックを設定
      (WebSocket as jest.Mock).mockImplementation(() => {
        throw new Error('接続エラー');
      });
      
      // scheduleReconnectをスパイ
      const scheduleReconnectSpy = jest.spyOn(wsManager as any, 'scheduleReconnect');
      
      // 接続を開始
      wsManager.connect();
      
      // エラーログが出力されたことを確認
      expect(logger.error).toHaveBeenCalled();
      
      // 再接続がスケジュールされたことを確認
      expect(scheduleReconnectSpy).toHaveBeenCalled();
    });
  });
  
  describe('disconnect', () => {
    it('WebSocket接続を切断できること', () => {
      // 内部状態を設定
      (wsManager as any).ws = mockWs;
      
      // 接続を切断
      wsManager.disconnect();
      
      // WebSocketが終了されたことを確認
      expect(mockWs.terminate).toHaveBeenCalled();
      
      // 内部状態が更新されたことを確認
      expect((wsManager as any).ws).toBeNull();
      expect((wsManager as any).connectionState).toBe('disconnected');
      
      // ログが出力されたことを確認
      expect(logger.info).toHaveBeenCalled();
    });
  });
  
  describe('subscribe', () => {
    it('チャンネルを購読できること', () => {
      // 内部状態を設定
      (wsManager as any).ws = mockWs;
      (wsManager as any).connectionState = 'connected';
      
      // チャンネルを購読
      const result = wsManager.subscribe('BTC/USDT', 'orderbook', undefined, 'spot');
      
      // 購読が成功したことを確認
      expect(result).toBe(true);
      
      // サブスクリプションが保存されたことを確認
      expect((wsManager as any).subscriptions.size).toBe(1);
      
      // サブスクリプションメッセージが送信されたことを確認
      expect(mockWs.send).toHaveBeenCalled();
      const sentMessage = JSON.parse(mockWs.send.mock.calls[0][0]);
      expect(sentMessage.op).toBe('subscribe');
      expect(sentMessage.args[0].instType).toBe('SP');
      expect(sentMessage.args[0].channel).toBe('books');
      expect(sentMessage.args[0].instId).toBe('BTCUSDT');
      
      // ログが出力されたことを確認
      expect(logger.info).toHaveBeenCalled();
    });
    
    it('ローソク足チャンネルを購読できること', () => {
      // 内部状態を設定
      (wsManager as any).ws = mockWs;
      (wsManager as any).connectionState = 'connected';
      
      // チャンネルを購読
      const result = wsManager.subscribe('BTC/USDT', 'kline', '1m', 'spot');
      
      // 購読が成功したことを確認
      expect(result).toBe(true);
      
      // サブスクリプションが保存されたことを確認
      expect((wsManager as any).subscriptions.size).toBe(1);
      
      // サブスクリプションメッセージが送信されたことを確認
      expect(mockWs.send).toHaveBeenCalled();
      const sentMessage = JSON.parse(mockWs.send.mock.calls[0][0]);
      expect(sentMessage.op).toBe('subscribe');
      expect(sentMessage.args[0].instType).toBe('SP');
      expect(sentMessage.args[0].channel).toBe('candle1min');
      expect(sentMessage.args[0].instId).toBe('BTCUSDT');
      
      // ログが出力されたことを確認
      expect(logger.info).toHaveBeenCalled();
    });
    
    it('先物取引チャンネルを購読できること', () => {
      // 内部状態を設定
      (wsManager as any).ws = mockWs;
      (wsManager as any).connectionState = 'connected';
      
      // チャンネルを購読
      const result = wsManager.subscribe('BTC/USDT', 'orderbook', undefined, 'futures');
      
      // 購読が成功したことを確認
      expect(result).toBe(true);
      
      // サブスクリプションが保存されたことを確認
      expect((wsManager as any).subscriptions.size).toBe(1);
      
      // サブスクリプションメッセージが送信されたことを確認
      expect(mockWs.send).toHaveBeenCalled();
      const sentMessage = JSON.parse(mockWs.send.mock.calls[0][0]);
      expect(sentMessage.op).toBe('subscribe');
      expect(sentMessage.args[0].instType).toBe('MC');
      expect(sentMessage.args[0].channel).toBe('books');
      expect(sentMessage.args[0].instId).toBe('BTCUSDT_UMCBL');
      
      // ログが出力されたことを確認
      expect(logger.info).toHaveBeenCalled();
    });
    
    it('タイムフレームなしでローソク足チャンネルを購読しようとするとエラーになること', () => {
      // 内部状態を設定
      (wsManager as any).ws = mockWs;
      (wsManager as any).connectionState = 'connected';
      
      // チャンネルを購読
      const result = wsManager.subscribe('BTC/USDT', 'kline', undefined, 'spot');
      
      // 購読が失敗したことを確認
      expect(result).toBe(false);
      
      // エラーログが出力されたことを確認
      expect(logger.error).toHaveBeenCalled();
    });
    
    it('サポートされていないチャンネルタイプを購読しようとするとエラーになること', () => {
      // 内部状態を設定
      (wsManager as any).ws = mockWs;
      (wsManager as any).connectionState = 'connected';
      
      // チャンネルを購読
      const result = wsManager.subscribe('BTC/USDT', 'unsupported', undefined, 'spot');
      
      // 購読が失敗したことを確認
      expect(result).toBe(false);
      
      // エラーログが出力されたことを確認
      expect(logger.error).toHaveBeenCalled();
    });
  });
  
  describe('unsubscribe', () => {
    it('チャンネルの購読を解除できること', () => {
      // 内部状態を設定
      (wsManager as any).ws = mockWs;
      (wsManager as any).connectionState = 'connected';
      
      // まずチャンネルを購読
      wsManager.subscribe('BTC/USDT', 'orderbook', undefined, 'spot');
      
      // 購読を解除
      const result = wsManager.unsubscribe('BTC/USDT', 'orderbook', undefined, 'spot');
      
      // 購読解除が成功したことを確認
      expect(result).toBe(true);
      
      // サブスクリプションが削除されたことを確認
      expect((wsManager as any).subscriptions.size).toBe(0);
      
      // 購読解除メッセージが送信されたことを確認
      expect(mockWs.send).toHaveBeenCalledTimes(2); // 購読と購読解除
      const sentMessage = JSON.parse(mockWs.send.mock.calls[1][0]);
      expect(sentMessage.op).toBe('unsubscribe');
      
      // ログが出力されたことを確認
      expect(logger.info).toHaveBeenCalled();
    });
  });
  
  describe('getSubscriptions', () => {
    it('現在のサブスクリプション一覧を取得できること', () => {
      // 内部状態を設定
      const subscription = {
        instType: 'SP',
        channel: 'books',
        instId: 'BTCUSDT'
      };
      const subKey = 'SP:books:BTCUSDT';
      const subId = JSON.stringify(subscription);
      const subscriptions = new Map();
      subscriptions.set(subKey, new Set([subId]));
      (wsManager as any).subscriptions = subscriptions;
      
      // サブスクリプション一覧を取得
      const result = wsManager.getSubscriptions();
      
      // 結果を確認
      expect(result).toEqual([subscription]);
    });
  });
  
  describe('getConnectionState', () => {
    it('接続状態を取得できること', () => {
      // 内部状態を設定
      (wsManager as any).connectionState = 'connected';
      
      // 接続状態を取得
      const result = wsManager.getConnectionState();
      
      // 結果を確認
      expect(result).toBe('connected');
    });
  });
  
  describe('isConnected', () => {
    it('接続されている場合はtrueを返すこと', () => {
      // 内部状態を設定
      (wsManager as any).connectionState = 'connected';
      
      // 接続状態を確認
      const result = wsManager.isConnected();
      
      // 結果を確認
      expect(result).toBe(true);
    });
    
    it('接続されていない場合はfalseを返すこと', () => {
      // 内部状態を設定
      (wsManager as any).connectionState = 'disconnected';
      
      // 接続状態を確認
      const result = wsManager.isConnected();
      
      // 結果を確認
      expect(result).toBe(false);
    });
  });
});