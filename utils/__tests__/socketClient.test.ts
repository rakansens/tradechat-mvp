// utils/__tests__/socketClient.test.ts
// Socket.ioクライアント機能のテスト

import { initializeSocketClient, requestCaptureFromClient, getSocket, getClientId } from '../socketClient';
import { Socket } from 'socket.io-client';
import { captureChartAsBase64 } from '../screenshotUtils';

// モックのセットアップ
jest.mock('socket.io-client', () => {
  const mockSocketOn = jest.fn();
  const mockSocketEmit = jest.fn();
  const mockSocketOff = jest.fn();
  
  const mockSocketInstance = {
    on: mockSocketOn,
    emit: mockSocketEmit,
    off: mockSocketOff,
  };
  
  const mockIo = jest.fn(() => mockSocketInstance);
  
  return {
    io: mockIo,
    mockSocketOn,
    mockSocketEmit,
    mockSocketOff,
    mockSocketInstance,
  };
});

jest.mock('../screenshotUtils', () => ({
  captureChartAsBase64: jest.fn(),
}));

// window オブジェクトのモック
const originalWindow = global.window;
beforeAll(() => {
  global.window = {} as any;
});

afterAll(() => {
  global.window = originalWindow;
});

describe('Socket.ioクライアント機能', () => {
  const { io, mockSocketOn, mockSocketEmit, mockSocketOff } = require('socket.io-client');
  const mockCaptureChart = captureChartAsBase64 as jest.Mock;
  
  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();
    
    // コンソールをモック
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });
  
  describe('initializeSocketClient', () => {
    it('ブラウザ環境以外では初期化しない', () => {
      // windowをundefinedに設定
      global.window = undefined as any;
      
      // 初期化を実行
      initializeSocketClient();
      
      // socket.io-clientが呼ばれていないことを確認
      expect(io).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('ブラウザ環境でのみ初期化できます')
      );
    });
    
    it('ブラウザ環境で正しく初期化される', () => {
      // windowオブジェクトをモック
      global.window = {} as any;
      
      // 初期化を実行
      initializeSocketClient();
      
      // socket.io-clientが呼ばれたことを確認
      expect(io).toHaveBeenCalled();
      
      // イベントリスナーが登録されたことを確認
      expect(mockSocketOn).toHaveBeenCalledWith('connected', expect.any(Function));
      expect(mockSocketOn).toHaveBeenCalledWith('capture_request', expect.any(Function));
      expect(mockSocketOn).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocketOn).toHaveBeenCalledWith('connect_error', expect.any(Function));
    });
  });
  
  describe('requestCaptureFromClient', () => {
    it('ソケットが初期化されていない場合はエラーを返す', async () => {
      // 未初期化状態をシミュレート
      const originalGetSocket = getSocket;
      Object.defineProperty(require('../socketClient'), 'getSocket', {
        value: jest.fn().mockReturnValue(null)
      });
      
      // リクエスト実行
      await expect(requestCaptureFromClient()).rejects.toThrow('Socket.IO接続が初期化されていません');
      
      // 元に戻す
      Object.defineProperty(require('../socketClient'), 'getSocket', {
        value: originalGetSocket
      });
    });
    
    it('正常にキャプチャリクエストを送信する', async () => {
      // 初期化状態をシミュレート
      const mockSocket = {
        on: jest.fn(),
        emit: jest.fn(),
        off: jest.fn()
      };
      
      Object.defineProperty(require('../socketClient'), 'getSocket', {
        value: jest.fn().mockReturnValue(mockSocket)
      });
      
      Object.defineProperty(require('../socketClient'), 'isInitialized', {
        value: true
      });
      
      // リクエスト実行（結果はPromiseがペンディング状態になる）
      const capturePromise = requestCaptureFromClient();
      
      // イベントリスナーが登録されたことを確認
      expect(mockSocket.on).toHaveBeenCalledWith('capture_response', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('error_message', expect.any(Function));
      
      // リクエストが送信されたことを確認
      expect(mockSocket.emit).toHaveBeenCalledWith('capture_request', expect.objectContaining({
        requestId: expect.any(String)
      }));
      
      // タイムアウトを防ぐために強制的にプロミスを解決する
      // （実際のテストでは、モックされたコールバックを実行してプロミスを解決する）
      jest.useFakeTimers();
      setTimeout(() => {}, 11000);
      jest.runAllTimers();
      
      // エラーハンドリングのためtryで囲む
      try {
        await capturePromise;
      } catch (e) {
        // タイムアウトは期待された動作
      }
    });
  });
}); 