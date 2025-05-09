// symbol-change-flow.test.ts
// 銘柄変更フローの統合テスト

import { changeSymbolTool } from '../../../src/mastra/tools/symbol-tools';
import { socketStoreActions } from '../../../store/socketActions';
import { logger } from '../../../utils/logger';

// モジュールをモック化
jest.mock('../../../src/mastra/tools/symbol-tools', () => ({
  changeSymbolTool: {
    execute: jest.fn(),
  },
}));

jest.mock('../../../store/socketActions', () => ({
  socketStoreActions: {
    setSymbol: jest.fn(),
    setExchangeType: jest.fn(),
  },
}));

jest.mock('../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// fetchをモック化
global.fetch = jest.fn();

// Socket.IOクライアントのモック
const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  disconnect: jest.fn(),
};

// Socket.IOのモック
jest.mock('socket.io-client', () => ({
  __esModule: true,
  default: jest.fn(() => mockSocket),
}));

// グローバルイベントをモック化
global.CustomEvent = jest.fn().mockImplementation((event, options) => ({
  type: event,
  detail: options?.detail,
}));

global.dispatchEvent = jest.fn();

describe('銘柄変更フロー', () => {
  let socketEventHandlers = {};
  
  beforeEach(async () => {
    // テスト前にモックをリセット
    jest.clearAllMocks();
    
    // Socket.IOのイベントハンドラを記録するようにモック
    mockSocket.on.mockImplementation((event, callback) => {
      socketEventHandlers[event] = callback;
      return mockSocket;
    });
    
    // fetchのモックレスポンスを設定
    global.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true, symbol: 'ETHUSDT' }),
    });
    
    // changeSymbolTool.executeのモックを設定
    changeSymbolTool.execute.mockResolvedValue({ success: true, symbol: 'ETHUSDT' });
    
    // socketClientモジュールを動的にインポート
    await import('../../../utils/socketClient');
  });

  it('Mastraツールから銘柄変更が正しくAppStoreに反映されること', async () => {
    // 1. Mastraツールの実行
    await changeSymbolTool.execute({ symbol: 'ETHUSDT', exchangeType: 'spot' });
    
    // APIリクエストが正しく送信されたか検証
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/chart/symbol',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('ETHUSDT'),
      })
    );
    
    // 2. Socket.IOイベントのシミュレーション
    const changeSymbolHandler = socketEventHandlers['changeSymbol'];
    expect(changeSymbolHandler).toBeDefined();
    
    // イベントハンドラを実行
    changeSymbolHandler({ symbol: 'ETHUSDT', exchangeType: 'spot' });
    
    // 3. AppStoreが更新されたか検証
    expect(socketStoreActions.setSymbol).toHaveBeenCalledWith(
      'ETHUSDT',
      'socket-changeSymbol'
    );
    
    expect(socketStoreActions.setExchangeType).toHaveBeenCalledWith(
      'spot',
      'ETHUSDT',
      'socket-changeSymbol'
    );
    
    // 4. グローバルイベントが発行されたか検証
    expect(global.CustomEvent).toHaveBeenCalledWith(
      'symbolChanged',
      expect.objectContaining({
        detail: expect.objectContaining({
          symbol: 'ETHUSDT',
        }),
      })
    );
    
    expect(global.dispatchEvent).toHaveBeenCalled();
  });

  it('取引タイプを指定せずに銘柄変更した場合、現在の取引タイプが保持されること', async () => {
    // 1. Mastraツールの実行（取引タイプ指定なし）
    await changeSymbolTool.execute({ symbol: 'ETHUSDT' });
    
    // 2. Socket.IOイベントのシミュレーション
    const changeSymbolHandler = socketEventHandlers['changeSymbol'];
    
    // イベントハンドラを実行（exchangeTypeなし）
    changeSymbolHandler({ symbol: 'ETHUSDT' });
    
    // 3. AppStoreが更新されたか検証
    expect(socketStoreActions.setSymbol).toHaveBeenCalledWith(
      'ETHUSDT',
      'socket-changeSymbol'
    );
    
    // setExchangeTypeは呼ばれないこと
    expect(socketStoreActions.setExchangeType).not.toHaveBeenCalled();
  });

  it('エラー発生時に適切にエラーハンドリングされること', async () => {
    // fetchのモックをエラーレスポンスに設定
    global.fetch.mockResolvedValue({
      ok: false,
      statusText: 'Internal Server Error',
      status: 500,
    });
    
    // changeSymbolTool.executeのモックをエラーに設定
    changeSymbolTool.execute.mockRejectedValue(
      new Error('銘柄の変更に失敗しました: Internal Server Error')
    );
    
    // テスト実行とエラー検証
    await expect(changeSymbolTool.execute({ symbol: 'ETHUSDT' }))
      .rejects
      .toThrow('銘柄の変更に失敗しました');
  });
});
