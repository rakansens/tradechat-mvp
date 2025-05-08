// src/mastra/tools/__tests__/instrument-type-tools.test.ts
// 取引タイプ（現物/先物）変更ツールのテスト
// 作成: 2025-05-08 - WebSocketベースの環境に対応

import { changeInstrumentTypeTool } from '@/src/mastra/tools/instrument-type-tools';
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

describe('changeInstrumentTypeTool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(changeInstrumentTypeTool).toBeDefined();
  });

  it('should have correct id and description', () => {
    expect(changeInstrumentTypeTool.id).toBe('change-instrument-type');
    expect(changeInstrumentTypeTool.description).toBe('現物取引と先物取引を切り替えます');
  });

  it('should have correct input schema', () => {
    expect(changeInstrumentTypeTool.inputSchema).toBeDefined();
    // zodスキーマのテストは複雑なので、存在確認のみ
  });

  it('should successfully change instrument type to spot', async () => {
    // テストデータ
    const type = 'spot';
    
    // fetchのモックを設定
    (fetch as unknown as jest.Mock).mockImplementationOnce(() => mockFetchPromise());
    mockJsonPromise.mockResolvedValueOnce({ success: true, type });
    
    // ツールを実行
    const result = await changeInstrumentTypeTool.execute({
      context: { type },
      runtimeContext: {} as any
    });
    
    // fetchが正しく呼ばれたことを確認
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chart/instrument-type'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ type }),
      })
    );
    
    // 結果を確認
    expect(result).toEqual({
      success: true,
      message: '取引タイプを現物に変更しました',
      type
    });
  });

  it('should successfully change instrument type to futures', async () => {
    // テストデータ
    const type = 'futures';
    
    // fetchのモックを設定
    (fetch as unknown as jest.Mock).mockImplementationOnce(() => mockFetchPromise());
    mockJsonPromise.mockResolvedValueOnce({ success: true, type });
    
    // ツールを実行
    const result = await changeInstrumentTypeTool.execute({
      context: { type },
      runtimeContext: {} as any
    });
    
    // fetchが正しく呼ばれたことを確認
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chart/instrument-type'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ type }),
      })
    );
    
    // 結果を確認
    expect(result).toEqual({
      success: true,
      message: '取引タイプを先物に変更しました',
      type
    });
  });

  it('should handle API errors gracefully', async () => {
    // テストデータ
    const type = 'spot';
    const errorMessage = 'API connection error';
    
    // fetchのモックを設定 - エラーレスポンス
    (fetch as unknown as jest.Mock).mockImplementationOnce(() => mockFetchPromise());
    mockJsonPromise.mockResolvedValueOnce({ 
      success: false, 
      type,
      error: errorMessage 
    });
    
    // ツールを実行
    const result = await changeInstrumentTypeTool.execute({
      context: { type },
      runtimeContext: {} as any
    });
    
    // fetchが正しく呼ばれたことを確認
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chart/instrument-type'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ type }),
      })
    );
    
    // 結果を確認
    expect(result).toEqual({
      success: false,
      message: `取引タイプの変更に失敗しました: ${errorMessage}`,
      type,
      error: errorMessage
    });
  });
  
  it('should handle network errors gracefully', async () => {
    // テストデータ
    const type = 'futures';
    const networkError = new Error('Network error');
    
    // fetchのモックを設定 - ネットワークエラー
    (fetch as unknown as jest.Mock).mockRejectedValueOnce(networkError);
    
    // ツールを実行
    const result = await changeInstrumentTypeTool.execute({
      context: { type },
      runtimeContext: {} as any
    });
    
    // fetchが正しく呼ばれたことを確認
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chart/instrument-type'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ type }),
      })
    );
    
    // 結果を確認
    expect(result).toEqual({
      success: false,
      message: '取引タイプの変更に失敗しました: Network error',
      type,
      error: 'Network error'
    });
  });
});
