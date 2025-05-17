// symbol-tools.test.ts
// 銘柄変更ツールのテスト
// Cascade: Mocked node-fetch, updated error case assertions, adapted mock responses.

import { changeSymbolTool } from '../../../src/mastra/tools/symbol-tools';
import { logger } from '../../../utils/logger';
import fetch from 'node-fetch'; // Import to mock
import { ExchangeType, ProductType } from '@/types/api';

// Mock logger
jest.mock('../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock node-fetch
const { Response: NodeFetchResponse } = jest.requireActual('node-fetch');
jest.mock('node-fetch', () => jest.fn());

const mockRuntimeContext: any = {
  invocationId: 'test-invocation-id',
  userId: 'test-user-id',
  // 必要に応じて他のプロパティを追加
};

// Helper to create a mock Response object compatible with node-fetch
const createMockNodeFetchResponse = (body: any, options: { ok: boolean; status: number; statusText: string; headers?: Record<string, string> }) => {
  const response = new NodeFetchResponse(JSON.stringify(body), {
    status: options.status,
    statusText: options.statusText,
    headers: { 'Content-Type': 'application/json', ...options.headers }, 
  });
  Object.defineProperty(response, 'ok', { value: options.ok });
  return response;
};

const mockSymbolApiResponse = (symbol: string, success = true, exchangeType?: ProductType) =>
  createMockNodeFetchResponse(
    { success, symbol, exchangeType }, 
    { ok: success, status: success ? 200 : 500, statusText: success ? 'OK' : 'Internal Server Error' }
  );

const mockSymbolApiErrorResponse = (symbol: string, errorMessage: string, exchangeType?: ProductType) =>
  createMockNodeFetchResponse(
    { success: false, symbol, error: errorMessage, exchangeType },
    { ok: false, status: 500, statusText: 'Internal Server Error' }
  );


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
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockSymbolApiResponse(inputSymbol, true, inputExchangeType));
    
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
    const mockInvalidJsonResponse = new NodeFetchResponse('Not a valid JSON', {
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
