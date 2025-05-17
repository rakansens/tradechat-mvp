/**
 * __tests__/services/socket/websocket-client.test.ts
 * WebSocketClientクラスのテスト
 * 
 * 作成: 2025-05-12 - WebSocketサービスのリファクタリングに伴い新規作成
 * 更新: 2025-05-13 - SocketCoreを使用する新しいアーキテクチャに対応
 */

import { Socket } from 'socket.io-client';
import { WebSocketClient } from '../../../services/socket/websocket-client';
import { SocketCore } from '../../../services/socket/core';
import { logger } from '@/utils/common';

// モックの設定
jest.mock('../../../services/socket/core', () => {
  return {
    SocketCore: {
      getSocket: jest.fn(),
      disconnect: jest.fn(),
      getConnectionStatus: jest.fn()
    }
  };
});

jest.mock('@/utils/common', () => {
  return {
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    }
  };
});

// モックソケットインスタンス
const mockSocket = {
  connected: true,
  id: 'mock-socket-id',
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn()
} as unknown as Socket;

describe('WebSocketClient', () => {
  let webSocketClient: WebSocketClient;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // SocketCoreのモック設定
    (SocketCore.getSocket as jest.Mock).mockReturnValue(mockSocket);
    (SocketCore.getConnectionStatus as jest.Mock).mockReturnValue({ 
      connected: true, 
      id: 'mock-socket-id' 
    });
    
    // WebSocketClientインスタンス作成
    webSocketClient = new WebSocketClient();
  });
  
  describe('initialize', () => {
    it('ブラウザ環境でない場合はnullを返すこと', () => {
      // windowオブジェクトをundefinedに設定
      const originalWindow = global.window;
      
      // WebSocketClient内部の実装をスパイ/モックする
      const windowSpy = jest.spyOn(global, 'window', 'get');
      // @ts-ignore - テスト用にwindowをundefinedとして扱う
      windowSpy.mockImplementation(() => undefined);
      
      const result = webSocketClient.initialize();
      
      // 結果を検証
      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        'サーバー環境では初期化できません',
        expect.objectContaining({
          component: 'WebSocketClient',
          action: 'initialize'
        })
      );
      
      // スパイを復元
      windowSpy.mockRestore();
      // 元に戻す
      global.window = originalWindow;
    });
    
    it('正常に初期化できること', () => {
      // 初期化を実行
      const result = webSocketClient.initialize();
      
      // 結果を検証
      expect(result).toBe(mockSocket);
      expect(SocketCore.getSocket).toHaveBeenCalledWith(true);
      expect(logger.info).toHaveBeenCalledWith(
        'WebSocketClient: Socket.IO接続を初期化しました',
        expect.objectContaining({
          component: 'WebSocketClient',
          action: 'initialize',
          connected: mockSocket.connected,
          id: mockSocket.id
        })
      );
    });
    
    it('SocketCoreがnullを返す場合はnullを返すこと', () => {
      // SocketCoreがnullを返すようにモックをこのテストでのみ設定
      jest.clearAllMocks();
      (SocketCore.getSocket as jest.Mock).mockReturnValue(null);
      
      // 初期化を実行
      const result = webSocketClient.initialize();
      
      // 結果を検証
      expect(result).toBeNull();
      
      // 元のモックに戻す
      (SocketCore.getSocket as jest.Mock).mockReturnValue(mockSocket);
    });
  });
  
  describe('getSocket', () => {
    it('SocketCoreからソケットを取得すること', () => {
      // getSocketを実行
      const result = webSocketClient.getSocket();
      
      // 結果を検証
      expect(result).toBe(mockSocket);
      expect(SocketCore.getSocket).toHaveBeenCalledWith(false);
    });
  });
  
  describe('isConnected', () => {
    it('接続状態を正しく返すこと', () => {
      // isConnectedを実行
      const result = webSocketClient.isConnected();
      
      // 結果を検証
      expect(result).toBe(true);
      expect(SocketCore.getConnectionStatus).toHaveBeenCalled();
    });
    
    it('未接続の場合はfalseを返すこと', () => {
      // 未接続状態をモック
      jest.clearAllMocks();
      (SocketCore.getConnectionStatus as jest.Mock).mockReturnValue({ 
        connected: false 
      });
      
      // isConnectedを実行
      const result = webSocketClient.isConnected();
      
      // 結果を検証
      expect(result).toBe(false);
      
      // 元のモックに戻す
      (SocketCore.getConnectionStatus as jest.Mock).mockReturnValue({ 
        connected: true, 
        id: 'mock-socket-id' 
      });
    });
  });
  
  describe('disconnect', () => {
    it('SocketCoreの切断を呼び出すこと', () => {
      // disconnectを実行
      webSocketClient.disconnect();
      
      // 結果を検証
      expect(SocketCore.disconnect).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'WebSocketClientの接続を切断しました',
        expect.objectContaining({
          component: 'WebSocketClient',
          action: 'disconnect'
        })
      );
    });
  });
  
  describe('scheduleReconnect', () => {
    it('再接続が自動的に処理されることをログ出力すること', () => {
      // scheduleReconnectを実行
      webSocketClient.scheduleReconnect();
      
      // 結果を検証
      expect(logger.info).toHaveBeenCalledWith(
        'WebSocketClientの再接続は自動的に処理されます',
        expect.objectContaining({
          component: 'WebSocketClient',
          action: 'scheduleReconnect'
        })
      );
    });
  });
});
