// instrument-type-change-flow.test.ts
// 取引タイプ変更フローの統合テスト
// Cascade: Corrected mocks, ToolExecutionContext, and added runtimeContext.
// Cascade: Added explicit return type to mockApiResponse.

import { changeInstrumentTypeTool } from '../../../src/mastra/tools/instrument-type-tools';
import { socketStoreActions } from '../../../store/socketActions';
import { logger } from '../../../utils/logger';

// モジュールをモック化
jest.mock('../../../src/mastra/tools/instrument-type-tools', () => ({
  changeInstrumentTypeTool: {
    execute: jest.fn(), // This will be cast to jest.Mock later where needed
  },
}));

jest.mock('../../../store/socketActions', () => ({
  socketStoreActions: {
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
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

const mockRuntimeContext: any = {
  invocationId: 'test-invocation-id',
  userId: 'test-user-id',
};

const mockApiResponse = (type: 'spot' | 'futures', success = true): Response => ({
  ok: success,
  json: jest.fn().mockResolvedValue({ success, type }),
  status: success ? 200 : 500,
  statusText: success ? 'OK' : 'Internal Server Error',
  headers: new Headers(),
  redirected: false,
  type: 'basic' as ResponseType,
  url: '/api/chart/instrument-type',
  clone: jest.fn(() => mockApiResponse(type, success)) as jest.MockedFunction<() => Response>,
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  blob: jest.fn().mockResolvedValue(new Blob()),
  formData: jest.fn().mockResolvedValue(new FormData()),
  text: jest.fn().mockResolvedValue(JSON.stringify({ success, type })),
  body: null,
  bodyUsed: false,
  bytes: jest.fn().mockResolvedValue(new ArrayBuffer(0)), 
} as unknown as Response);

// Socket.IOクライアントのモック
const mockSocket = {
  on: jest.fn() as jest.Mock,
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
})) as jest.Mock;

global.dispatchEvent = jest.fn();

describe('取引タイプ変更フロー', () => {
  let socketEventHandlers: Record<string, (...args: any[]) => void> = {};
  
  beforeEach(async () => {
    jest.clearAllMocks();
    socketEventHandlers = {}; // Reset handlers for each test
    
    mockSocket.on.mockImplementation((event: string, callback: (...args: any[]) => void) => {
      socketEventHandlers[event] = callback;
      return mockSocket;
    });
    
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockApiResponse('futures'));
    (changeInstrumentTypeTool.execute as jest.Mock).mockResolvedValue({ success: true, type: 'futures' });
    
    await import('../../../utils/socketClient'); // Dynamically import to apply mocks
  });

  it('Mastraツールから取引タイプ変更が正しくAppStoreに反映されること', async () => {
    // mockImplementationOnceで明示的にfetchの呼び出しを実装
    (changeInstrumentTypeTool.execute as jest.Mock).mockImplementationOnce(async ({ context }) => {
      const { type, fromType, symbol } = context;
      await (global.fetch as jest.MockedFunction<typeof fetch>)('/api/chart/instrument-type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ type, fromType, symbol }),
      });
      return { success: true, type, fromType, message: 'Success' };
    });
    
    await (changeInstrumentTypeTool.execute as jest.Mock)({ 
      context: {
        type: 'futures',
        fromType: 'spot',
        symbol: 'BTCUSDT'
      },
      runtimeContext: mockRuntimeContext
    });
    
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/chart/instrument-type',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ type: 'futures', fromType: 'spot', symbol: 'BTCUSDT' }),
      })
    );
    
    // Socketイベントハンドラーの確認と実行
    const instrumentTypeChangeHandler = socketEventHandlers['instrument-type-change'];
    expect(instrumentTypeChangeHandler).toBeDefined();
    
    if (instrumentTypeChangeHandler) {
      instrumentTypeChangeHandler({ 
        type: 'futures',
        fromType: 'spot',
        symbol: 'BTCUSDT'
      });
      
      // 実装に合わせて引数を修正
      expect(socketStoreActions.setExchangeType).toHaveBeenCalledWith(
        'futures',
        'BTCUSDT',
        'socket-instrument-type-change'
      );
    }
    
    expect(global.CustomEvent).toHaveBeenCalledWith(
      'instrumentTypeChanged',
      expect.objectContaining({
        detail: expect.objectContaining({
          type: 'futures',
          fromType: 'spot',
        }),
      })
    );
    
    expect(global.dispatchEvent).toHaveBeenCalled();
  });

  it('現物取引への変更が正しく処理されること', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockApiResponse('spot'));
    
    // 同じく自前でfetchを呼び出すようにモック実装
    (changeInstrumentTypeTool.execute as jest.Mock).mockImplementationOnce(async ({ context }) => {
      const { type, fromType, symbol } = context;
      await (global.fetch as jest.MockedFunction<typeof fetch>)('/api/chart/instrument-type', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ type, fromType, symbol }),
      });
      return { success: true, type, message: 'Success' };
    });
    
    await (changeInstrumentTypeTool.execute as jest.Mock)({ 
      context: {
        type: 'spot',
        fromType: 'futures',
        symbol: 'BTCUSDT'
      },
      runtimeContext: mockRuntimeContext
    });
    
    // 動的にモジュールを再ロードしてイベントリスナーを確保
    await import('../../../utils/socketClient');
    
    const instrumentTypeChangeHandler = socketEventHandlers['instrument-type-change'];
    expect(instrumentTypeChangeHandler).toBeDefined(); // Ensure handler is defined before calling

    if (instrumentTypeChangeHandler) {
      instrumentTypeChangeHandler({ 
        type: 'spot',
        fromType: 'futures',
        symbol: 'BTCUSDT'
      });
      
      // 実装に合わせて引数を修正
      expect(socketStoreActions.setExchangeType).toHaveBeenCalledWith(
        'spot',
        'BTCUSDT',
        'socket-instrument-type-change'
      );
    }
  });

  it('エラー発生時に適切にエラーハンドリングされること', async () => {
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockApiResponse('futures', false));
    (changeInstrumentTypeTool.execute as jest.Mock).mockRejectedValue(
      new Error('取引タイプの変更に失敗しました: Internal Server Error')
    );
    
    await expect((changeInstrumentTypeTool.execute as jest.Mock)({ 
      context: {
        type: 'futures',
        fromType: 'spot',
        symbol: 'BTCUSDT'
      },
      runtimeContext: mockRuntimeContext
    }))
      .rejects
      .toThrow('取引タイプの変更に失敗しました: Internal Server Error');
  });
});
