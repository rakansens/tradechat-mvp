// src/mastra/tools/__tests__/timeframe-tools.test.ts
// 時間足変更ツールのテスト
// 更新: 2025-05-07 - Socket.IO直接使用からAPIエンドポイント使用に変更

import { changeTimeframeTool } from '@/src/mastra/tools/timeframe-tools';
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

describe('changeTimeframeTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(changeTimeframeTool).toBeDefined();
  });

  it('should have correct id and description', () => {
    expect(changeTimeframeTool.id).toBe('change-timeframe');
    expect(changeTimeframeTool.description).toBe('チャートの時間足を変更します。');
  });

  it('should have correct input schema', () => {
    expect(changeTimeframeTool.inputSchema).toBeDefined();
    // zodスキーマのテストは複雑なので、存在確認のみ
  });

  it('should successfully change timeframe', async () => {
    // テストデータ
    const timeframe = '1h';
    
    // fetchのモックを設定
    (fetch as unknown as jest.Mock).mockImplementationOnce(() => mockFetchPromise());
    mockJsonPromise.mockResolvedValueOnce({ success: true, timeframe });
    
    // ツールを実行
    const result = await changeTimeframeTool.execute({
      context: { timeframe },
      runtimeContext: {} as any
    });
    
    // fetchが正しく呼ばれたことを確認
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chart/timeframe'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ timeframe }),
      })
    );
    
    // 結果を確認
    expect(result).toEqual({
      success: true,
      timeframe
    });
  });

  it('should handle API errors gracefully', async () => {
    // テストデータ
    const timeframe = '4h';
    const errorMessage = 'API connection error';
    
    // fetchのモックを設定 - エラーレスポンス
    (fetch as unknown as jest.Mock).mockImplementationOnce(() => mockFetchPromise());
    mockJsonPromise.mockResolvedValueOnce({ 
      success: false, 
      timeframe,
      error: errorMessage 
    });
    
    // ツールを実行
    const result = await changeTimeframeTool.execute({
      context: { timeframe },
      runtimeContext: {} as any
    });
    
    // fetchが正しく呼ばれたことを確認
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chart/timeframe'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ timeframe }),
      })
    );
    
    // 結果を確認
    expect(result).toEqual({
      success: false,
      timeframe,
      error: errorMessage
    });
  });
  
  it('should handle network errors gracefully', async () => {
    // テストデータ
    const timeframe = '4h';
    const networkError = new Error('Network error');
    
    // fetchのモックを設定 - ネットワークエラー
    (fetch as unknown as jest.Mock).mockRejectedValueOnce(networkError);
    
    // ツールを実行
    const result = await changeTimeframeTool.execute({
      context: { timeframe },
      runtimeContext: {} as any
    });
    
    // fetchが正しく呼ばれたことを確認
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chart/timeframe'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ timeframe }),
      })
    );
    
    // 結果を確認
    expect(result).toEqual({
      success: false,
      timeframe,
      error: 'Network error'
    });
  });
});
