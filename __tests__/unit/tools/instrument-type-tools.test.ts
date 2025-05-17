// instrument-type-tools.test.ts
// Cascade: Mocked node-fetch, updated error case assertions to expect resolved objects.
// Cascade: Corrected import path for ExchangeType.

import { changeInstrumentTypeTool } from '../../../src/mastra/tools/instrument-type-tools';
import { logger } from '../../../utils/logger';
import fetch from 'node-fetch'; // Import to mock
import { ExchangeType, ProductType } from '../../../types/api';

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
};

// Helper to create a mock Response object compatible with node-fetch
const createMockNodeFetchResponse = (body: any, options: { ok: boolean; status: number; statusText: string; }) => {
  const response = new NodeFetchResponse(JSON.stringify(body), {
    status: options.status,
    statusText: options.statusText,
    headers: { 'Content-Type': 'application/json' },
  });
  // Manually set 'ok' as it's a getter in the actual Response class
  Object.defineProperty(response, 'ok', { value: options.ok });
  return response;
};

const mockApiResponse = (type: 'spot' | 'futures', success = true) => 
  createMockNodeFetchResponse(
    { success, type }, 
    { ok: success, status: success ? 200 : 500, statusText: success ? 'OK' : 'Internal Server Error' }
  );

const mockApiErrorResponseText = (errorMessage: string, type: 'spot' | 'futures') =>
  createMockNodeFetchResponse(
    { success: false, error: errorMessage, type },
    { ok: false, status: 500, statusText: 'Internal Server Error' }
  );


describe('changeInstrumentTypeTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default successful response for most tests
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockApiResponse('spot'));
  });

  it('取引タイプ変更ツールが正しくAPIを呼び出すこと (spot)', async () => {
    const input = { context: { type: 'spot' as ProductType }, runtimeContext: mockRuntimeContext };
    await changeInstrumentTypeTool.execute(input);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chart/instrument-type'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ type: 'spot', fromType: 'futures', symbol: undefined }),
      })
    );
  });

  it('取引タイプ変更ツールが正しくAPIを呼び出すこと (futures)', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockApiResponse('futures'));
    const input = { context: { type: 'futures' as ProductType, symbol: 'BTCUSDT' }, runtimeContext: mockRuntimeContext };
    await changeInstrumentTypeTool.execute(input);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chart/instrument-type'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ type: 'futures', fromType: 'spot', symbol: 'BTCUSDT' }),
      })
    );
  });

  it('APIエラー時に適切にエラーを処理すること (500 Internal Server Error)', async () => {
    const errorMessage = 'Server is down'; // This is the initial error the API mock will report
    // The tool will try to parse this, but the overall failure will be due to retries
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockApiErrorResponseText(errorMessage, 'spot'));
    
    const result = await changeInstrumentTypeTool.execute({ context: { type: 'spot' }, runtimeContext: mockRuntimeContext });

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        // Expected message after retries for a persistent 500 error from the API
        message: `取引タイプの変更に失敗しました: APIリクエストが3回失敗しました: 500`,
        type: 'spot',
        fromType: 'futures',
        // The specific error from the tool after retries
        error: `APIリクエストが3回失敗しました: 500`,
      })
    );
    // Verify logger.warn was called due to retries for non-ok response
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('取引タイプ変更APIリクエストが失敗しました (500)'),
      expect.anything()
    );
  });

  it('ネットワークエラー時に適切にエラーを処理すること', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network connection failed'));
    
    const result = await changeInstrumentTypeTool.execute({ context: { type: 'futures' }, runtimeContext: mockRuntimeContext });

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        message: '取引タイプの変更に失敗しました: APIリクエストが3回失敗しました: レスポンスなし',
        type: 'futures',
        fromType: 'spot',
        error: 'APIリクエストが3回失敗しました: レスポンスなし',
      })
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('取引タイプ変更APIリクエスト中にエラーが発生しました'),
      expect.anything()
    );
  });

  it('JSONパースエラー時に適切にエラーを処理すること', async () => {
    const mockInvalidJsonResponse = new NodeFetchResponse('Invalid JSON', {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' }, // Lies about content type
    });
    Object.defineProperty(mockInvalidJsonResponse, 'ok', { value: true });
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockInvalidJsonResponse);

    const result = await changeInstrumentTypeTool.execute({ context: { type: 'spot' }, runtimeContext: mockRuntimeContext });
    
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('レスポンスのJSONパースに失敗しました'),
        type: 'spot',
        fromType: 'futures',
        error: expect.stringContaining('レスポンスのJSONパースに失敗しました'),
      })
    );
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('JSONパースエラー: Invalid JSON'),
      expect.anything()
    );
  });

  it('成功時には正しい結果を返すこと', async () => {
    const result = await changeInstrumentTypeTool.execute({ context: { type: 'spot', symbol: 'ETHUSDT' }, runtimeContext: mockRuntimeContext });
    expect(result).toEqual({
      success: true,
      message: '取引タイプを現物に変更しました',
      type: 'spot',
      fromType: 'futures',
      symbol: undefined, // Symbol is part of input, not output structure unless error
    });
  });
});
