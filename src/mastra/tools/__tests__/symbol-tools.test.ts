// src/mastra/tools/__tests__/symbol-tools.test.ts
// 銘柄変更ツールのテスト
// 更新: 2025-05-07 - Socket.IO直接使用からAPIエンドポイント使用に変更

import { changeSymbolTool } from '@/src/mastra/tools/symbol-tools';
import fetch from 'node-fetch';

// fetchのモック
jest.mock('node-fetch', () => {
  return {
    __esModule: true,
    default: jest.fn()
  };
});

// レスポンスのモック
const mockJsonPromise = jest.fn().mockResolvedValue({ success: true });
const mockFetchPromise = jest.fn().mockResolvedValue({
  json: mockJsonPromise,
  ok: true,
  status: 200,
});

// loggerのモック
jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

describe('changeSymbolTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(changeSymbolTool).toBeDefined();
  });

  it('should have correct id and description', () => {
    expect(changeSymbolTool.id).toBe('change-symbol');
    expect(changeSymbolTool.description).toBe('チャートの銘柄を変更します。');
  });

  it('should have correct input schema', () => {
    expect(changeSymbolTool.inputSchema).toBeDefined();
    // zodスキーマのテストは複雑なので、存在確認のみ
  });

  it('should successfully change symbol', async () => {
    // テストデータ
    const symbol = 'BTCUSDT';
    
    // fetchのモックを設定
    (fetch as unknown as jest.Mock).mockImplementationOnce(() => mockFetchPromise());
    mockJsonPromise.mockResolvedValueOnce({ success: true, symbol });
    
    // ツールを実行
    const result = await changeSymbolTool.execute({
      context: { symbol },
      runtimeContext: {} as any
    });
    
    // fetchが正しく呼ばれたことを確認
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chart/symbol'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ symbol }),
      })
    );
    
    // 結果を確認
    expect(result).toEqual({
      success: true,
      symbol
    });
  });

  it('should handle API errors gracefully', async () => {
    // テストデータ
    const symbol = 'ETHUSDT';
    const errorMessage = 'API connection error';
    
    // fetchのモックを設定 - エラーレスポンス
    (fetch as unknown as jest.Mock).mockImplementationOnce(() => mockFetchPromise());
    mockJsonPromise.mockResolvedValueOnce({ 
      success: false, 
      symbol,
      error: errorMessage 
    });
    
    // ツールを実行
    const result = await changeSymbolTool.execute({
      context: { symbol },
      runtimeContext: {} as any
    });
    
    // fetchが正しく呼ばれたことを確認
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chart/symbol'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ symbol }),
      })
    );
    
    // 結果を確認
    expect(result).toEqual({
      success: false,
      symbol,
      error: errorMessage
    });
  });
  
  it('should handle network errors gracefully', async () => {
    // テストデータ
    const symbol = 'SOLUSDT';
    const networkError = new Error('Network error');
    
    // fetchのモックを設定 - ネットワークエラー
    (fetch as unknown as jest.Mock).mockRejectedValueOnce(networkError);
    
    // ツールを実行
    const result = await changeSymbolTool.execute({
      context: { symbol },
      runtimeContext: {} as any
    });
    
    // fetchが正しく呼ばれたことを確認
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chart/symbol'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ symbol }),
      })
    );
    
    // 結果を確認
    expect(result).toEqual({
      success: false,
      symbol,
      error: 'Network error'
    });
  });
});
