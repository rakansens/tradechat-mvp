// symbol-tools.test.ts
// 銘柄変更ツールのテスト
// Cascade: Uses global fetch; updated error case assertions and mock responses.

import { changeSymbolTool } from '../../../src/mastra/tools/symbol-tools';
import { logger } from '@/utils/common';
import fetch from '@/mocks/node-fetch'; // モックの使用
import { ExchangeType, ProductType } from '@/types/api';

// Mock logger
jest.mock('@/utils/common', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock fetch - global.fetch is configured in jest.setup.js

const mockRuntimeContext: any = {
  invocationId: 'test-invocation-id',
  userId: 'test-user-id',
  // 必要に応じて他のプロパティを追加
};

// Helper to create a mock Response object
const createMockResponse = (body: any, options: { ok: boolean; status: number; statusText: string; headers?: Record<string, string> }) => {
  return {
    ok: options.ok,
    status: options.status,
    statusText: options.statusText,
    headers: new Headers(options.headers || {}),
    json: async () => body,
    text: async () => JSON.stringify(body)
  } as any as Response;
};

// Mock successful API response
const mockSymbolApiResponse = (symbol: string, success = true, exchangeType?: ProductType) => {
  return createMockResponse({ success, symbol, exchangeType }, { ok: true, status: 200, statusText: 'OK' });
};

// Mock error API response
const mockSymbolApiErrorResponse = (symbol: string, errorMessage: string, exchangeType?: ProductType) => {
  return createMockResponse({ success: false, error: errorMessage, symbol, exchangeType }, { ok: false, status: 400, statusText: 'Bad Request' });
};

describe('changeSymbolTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default successful response
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockSymbolApiResponse('BTCUSDT'));
  });

  it('銘柄変更ツールが正しくAPIを呼び出すこと', async () => {
    const input = { context: { symbol: 'ETHUSDT' }, runtimeContext: mockRuntimeContext };
    await changeSymbolTool.execute(input);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chart/symbol'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: 'ETHUSDT', exchangeType: undefined }),
      })
    );
  });

  it('取引タイプを指定して銘柄変更ができること', async () => {
    const inputSymbol = 'SOLUSDT';
    const inputExchangeType = 'futures' as ProductType;
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      json: async () => ({ message: 'Symbol changed successfully' }),
      text: async () => ''
    } as any as Response);

    const input = { 
      context: { symbol: inputSymbol, exchangeType: inputExchangeType }, 
      runtimeContext: mockRuntimeContext 
    };
    await changeSymbolTool.execute(input);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chart/symbol'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: inputSymbol, exchangeType: inputExchangeType }),
      })
    );
  });

  it('APIエラー時に適切にエラーを処理すること', async () => {
    const inputSymbol = 'ADAUSDT';
    const errorMessage = 'Failed to change symbol due to API error';
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockSymbolApiErrorResponse(inputSymbol, errorMessage));

    const result = await changeSymbolTool.execute({ context: { symbol: inputSymbol }, runtimeContext: mockRuntimeContext });

    expect(result).toEqual({
      success: false,
      symbol: inputSymbol,
      error: '銘柄変更に失敗しました: Internal Server Error', // This is the error thrown if response.ok is false
    });
  });

  it('ネットワークエラー時に適切にエラーを処理すること', async () => {
    const inputSymbol = 'LINKUSDT';
    const networkErrorMessage = 'Network connection unavailable';
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error(networkErrorMessage));

    const result = await changeSymbolTool.execute({ context: { symbol: inputSymbol }, runtimeContext: mockRuntimeContext });

    expect(result).toEqual({
      success: false,
      symbol: inputSymbol,
      error: networkErrorMessage,
    });
  });

  it('JSONパースエラー時に適切にエラーを処理すること', async () => {
    const inputSymbol = 'DOTUSDT';
    const mockInvalidJsonResponse = new Response('Not a valid JSON', {
        status: 200, statusText: 'OK', headers: { 'Content-Type': 'text/plain' }
    });
    Object.defineProperty(mockInvalidJsonResponse, 'ok', { value: true });
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockInvalidJsonResponse);

    const result = await changeSymbolTool.execute({ context: { symbol: inputSymbol }, runtimeContext: mockRuntimeContext });

    expect(result.success).toBe(false);
    expect(result.symbol).toBe(inputSymbol);
    expect(result.error).toMatch(/Unexpected token/); // Or more specific error message from JSON.parse
  });


  it('成功時には正しい結果を返すこと', async () => {
    const inputSymbol = 'XRPUSDT';
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockSymbolApiResponse(inputSymbol));
    const result = await changeSymbolTool.execute({ context: { symbol: inputSymbol }, runtimeContext: mockRuntimeContext });
    expect(result).toEqual({
      success: true,
      symbol: inputSymbol,
      error: undefined, // Explicitly undefined for success case if not present
    });
  });
});
