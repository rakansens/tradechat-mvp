// utils/__tests__/socketClient.test.ts
// Socket.ioクライアントのテスト

import { initializeSocketClient, getSocket, getClientId } from '../socketClient';
import { Socket } from 'socket.io-client';

// Socket.io-clientのモック
jest.mock('socket.io-client', () => {
  const mockOn = jest.fn();
  const mockEmit = jest.fn();
  const mockOff = jest.fn();
  
  const mockIo = jest.fn(() => ({
    on: mockOn,
    emit: mockEmit,
    off: mockOff,
    connect: jest.fn(),
    disconnect: jest.fn()
  }));
  
  return {
    io: mockIo,
    Socket: jest.fn()
  };
});

// スクリーンショットユーティリティのモック
jest.mock('../screenshotUtils', () => ({
  captureChartAsBase64: jest.fn().mockResolvedValue('mock-base64-data')
}));

describe('socketClient', () => {
  let originalWindow: any;
  
  beforeEach(() => {
    // windowオブジェクトのモック
    originalWindow = global.window;
    global.window = {} as any;
    
    // jestのモックをリセット
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // windowオブジェクトを元に戻す
    global.window = originalWindow;
  });
  
  describe('initializeSocketClient', () => {
    it('ブラウザ環境以外では初期化されない', () => {
      // windowをundefinedに設定
      global.window = undefined as any;
      
      // 初期化を実行
      initializeSocketClient();
      
      // Socket.ioがインスタンス化されていないことを確認
      const socket = getSocket();
      expect(socket).toBeNull();
    });
    
    it('ブラウザ環境で正常に初期化される', () => {
      // 初期化を実行
      initializeSocketClient();
      
      // Socket.ioのioがインスタンス化されることを確認
      expect(require('socket.io-client').io).toHaveBeenCalled();
    });
  });
  
  // 実際の接続テストはe2eテストで行うべきなので、ここではモックテストのみ
}); 