// __tests__/utils/socketClient.test.ts
// socketClient.tsのテスト
//
// 主な機能:
// - instrument-type-changeイベント処理のテスト
// - ローカルストレージへの保存処理のテスト
// - グローバルイベントの発行処理のテスト

import { Socket } from 'socket.io-client';
import { initializeSocketClient } from '../../utils/socketClient';
import { logger } from '../../utils/logger';

// モック
jest.mock('socket.io-client', () => {
  const mockOn = jest.fn();
  const mockEmit = jest.fn();
  const mockDisconnect = jest.fn();
  
  const mockSocket = {
    on: mockOn,
    emit: mockEmit,
    disconnect: mockDisconnect,
    connected: true
  };
  
  return {
    io: jest.fn(() => mockSocket)
  };
});

jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// localStorageのモック
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => {
      return store[key] || null;
    }),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    getAll: () => store
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// dispatchEventのモック
window.dispatchEvent = jest.fn();

describe('socketClient', () => {
  // テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
  });
  
  describe('instrument-type-change event', () => {
    it('先物から現物への切り替え時に正しくイベントを発行し、ローカルストレージに保存すること', () => {
      // socketClientを初期化
      initializeSocketClient();
      
      // Socket.ioのonメソッドの呼び出しを取得
      const mockOn = require('socket.io-client').io().on;
      
      // instrument-type-changeイベントのハンドラを取得
      const instrumentTypeChangeHandler = mockOn.mock.calls.find(
        (call: any[]) => call[0] === 'instrument-type-change'
      )[1];
      
      // 現在の銘柄をローカルストレージに設定
      mockLocalStorage.setItem('lastUsedSymbol', 'BTCUSDT');
      
      // ハンドラを呼び出し（先物から現物への切り替え）
      instrumentTypeChangeHandler({ type: 'spot' });
      
      // グローバルイベントが発行されたことを確認
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'instrumentTypeChanged',
          detail: expect.objectContaining({
            type: 'spot',
            fromType: 'futures'
          })
        })
      );
      
      // ローカルストレージに保存されたことを確認
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('lastUsedExchangeType', 'spot');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('selectedInstrumentType', 'spot');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('lastUsedSymbol', 'BTCUSDT');
      
      // ログが出力されたことを確認
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('取引タイプ変更イベント受信'),
        expect.objectContaining({
          component: 'socketClient',
          action: 'instrument-type-change'
        })
      );
    });
    
    it('現物から先物への切り替え時に正しくイベントを発行し、ローカルストレージに保存すること', () => {
      // socketClientを初期化
      initializeSocketClient();
      
      // Socket.ioのonメソッドの呼び出しを取得
      const mockOn = require('socket.io-client').io().on;
      
      // instrument-type-changeイベントのハンドラを取得
      const instrumentTypeChangeHandler = mockOn.mock.calls.find(
        (call: any[]) => call[0] === 'instrument-type-change'
      )[1];
      
      // 現在の銘柄をローカルストレージに設定
      mockLocalStorage.setItem('lastUsedSymbol', 'ETHUSDT');
      
      // ハンドラを呼び出し（現物から先物への切り替え）
      instrumentTypeChangeHandler({ type: 'futures' });
      
      // グローバルイベントが発行されたことを確認
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'instrumentTypeChanged',
          detail: expect.objectContaining({
            type: 'futures',
            fromType: 'spot'
          })
        })
      );
      
      // ローカルストレージに保存されたことを確認
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('lastUsedExchangeType', 'futures');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('selectedInstrumentType', 'futures');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('lastUsedSymbol', 'ETHUSDT');
    });
    
    it('ローカルストレージへの保存に失敗した場合、エラーをログ出力すること', () => {
      // socketClientを初期化
      initializeSocketClient();
      
      // Socket.ioのonメソッドの呼び出しを取得
      const mockOn = require('socket.io-client').io().on;
      
      // instrument-type-changeイベントのハンドラを取得
      const instrumentTypeChangeHandler = mockOn.mock.calls.find(
        (call: any[]) => call[0] === 'instrument-type-change'
      )[1];
      
      // ローカルストレージへの保存でエラーが発生するようにモック
      const mockError = new Error('ローカルストレージへのアクセスエラー');
      mockLocalStorage.setItem.mockImplementationOnce(() => { throw mockError; });
      
      // ハンドラを呼び出し
      instrumentTypeChangeHandler({ type: 'spot' });
      
      // エラーがログ出力されたことを確認
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('ローカルストレージへの取引タイプ保存に失敗しました'),
        expect.objectContaining({
          component: 'socketClient',
          action: 'saveToLocalStorage',
          error: mockError
        })
      );
    });
  });
});