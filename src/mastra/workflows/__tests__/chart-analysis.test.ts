// src/mastra/workflows/__tests__/chart-analysis.test.ts
// 作成: チャート分析ワークフローのテスト実装

import { analyzeTimeframeWorkflow } from '@/src/mastra/workflows/chart-analysis';
import { changeTimeframeTool } from '@/src/mastra/tools/timeframe-tools';
import { chartCaptureAnalysisTool } from '@/src/mastra/tools/chart-capture';
import { logger } from '@/utils/logger';

// 必要なモック
jest.mock('@/src/mastra/tools/timeframe-tools', () => ({
  changeTimeframeTool: {
    execute: jest.fn()
  }
}));

jest.mock('@/src/mastra/tools/chart-capture', () => ({
  chartCaptureAnalysisTool: {
    execute: jest.fn()
  }
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('analyzeTimeframeWorkflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトのモック応答を設定
    (changeTimeframeTool.execute as jest.Mock).mockResolvedValue({
      success: true,
      timeframe: '1h'
    });
    
    (chartCaptureAnalysisTool.execute as jest.Mock).mockResolvedValue({
      analysis: 'テスト分析結果',
      recommendation: '買いを推奨',
      confidence: 85,
      imageId: 'test-image-id',
      imageCaption: 'テストキャプション'
    });
  });

  it('should successfully complete workflow when tools succeed', async () => {
    // テスト実行
    const result = await analyzeTimeframeWorkflow({
      timeframe: '1h',
      focusOn: 'トレンド'
    });
    
    // 期待される結果を確認
    expect(result).toEqual({
      success: true,
      timeframe: '1h',
      analysis: 'テスト分析結果',
      recommendation: '買いを推奨',
      confidence: 85,
      imageId: 'test-image-id'
    });
    
    // ツールが正しく呼び出されたことを確認
    expect(changeTimeframeTool.execute).toHaveBeenCalledWith({
      context: { timeframe: '1h' },
      runtimeContext: {}
    });
    
    expect(chartCaptureAnalysisTool.execute).toHaveBeenCalledWith({
      context: { focusOn: 'トレンド' },
      runtimeContext: {}
    });
    
    // ロガーが正しく呼び出されたことを確認
    expect(logger.info).toHaveBeenCalledTimes(4); // ワークフロー開始、ステップ1、ステップ2、成功結果のログ
  });

  it('should return error when timeframe change fails', async () => {
    // 時間足変更の失敗をシミュレート
    (changeTimeframeTool.execute as jest.Mock).mockResolvedValue({
      success: false,
      timeframe: '1h',
      error: '時間足の変更に失敗しました'
    });
    
    // テスト実行
    const result = await analyzeTimeframeWorkflow({
      timeframe: '1h'
    });
    
    // 期待される結果を確認
    expect(result).toEqual({
      success: false,
      timeframe: '1h',
      error: '時間足1hへの変更に失敗しました'
    });
    
    // チャートキャプチャツールが呼ばれないことを確認
    expect(chartCaptureAnalysisTool.execute).not.toHaveBeenCalled();
    
    // エラーがログに記録されたことを確認
    expect(logger.error).toHaveBeenCalled();
  });

  it('should handle chart analysis tool error', async () => {
    // チャート分析の失敗をシミュレート
    (chartCaptureAnalysisTool.execute as jest.Mock).mockRejectedValue(
      new Error('チャートキャプチャ中にエラーが発生しました')
    );
    
    // テスト実行
    const result = await analyzeTimeframeWorkflow({
      timeframe: '1h'
    });
    
    // 期待される結果を確認
    expect(result).toEqual({
      success: false,
      error: 'チャートキャプチャ中にエラーが発生しました',
      timeframe: '1h'
    });
    
    // エラーがログに記録されたことを確認
    expect(logger.error).toHaveBeenCalled();
  });

  it('should handle unexpected errors gracefully', async () => {
    // 予期せぬエラーをシミュレート
    (changeTimeframeTool.execute as jest.Mock).mockImplementation(() => {
      throw new Error('予期せぬエラー');
    });
    
    // テスト実行
    const result = await analyzeTimeframeWorkflow({
      timeframe: '1h'
    });
    
    // 期待される結果を確認
    expect(result).toEqual({
      success: false,
      error: '予期せぬエラー',
      timeframe: '1h'
    });
    
    // エラーがログに記録されたことを確認
    expect(logger.error).toHaveBeenCalled();
  });
});
