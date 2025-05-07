// src/mastra/workflows/__tests__/entry-suggestion.test.ts
// 作成: エントリー提案ワークフローのテスト実装

import { entrySuggestionWorkflow } from '@/src/mastra/workflows/entry-suggestion';
import { entrySuggestionTool } from '@/src/mastra/tools/entry-suggestion';
import { multiTimeframeAnalysisWorkflow } from '@/src/mastra/workflows/timeframe-analysis';
import { logger } from '@/utils/logger';
import { TradeSide } from '@/types/entry';

// 必要なモック
jest.mock('@/src/mastra/tools/entry-suggestion', () => ({
  entrySuggestionTool: {
    execute: jest.fn()
  }
}));

jest.mock('@/src/mastra/workflows/timeframe-analysis', () => ({
  multiTimeframeAnalysisWorkflow: jest.fn()
}));

jest.mock('@/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));

describe('entrySuggestionWorkflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // マルチタイムフレーム分析のモック応答を設定
    (multiTimeframeAnalysisWorkflow as jest.Mock).mockResolvedValue({
      success: true,
      timeframes: ['15m', '1h', '4h', '1d'],
      analyses: [
        { timeframe: '15m', analysis: '15分足分析', recommendation: '買い', confidence: 65 },
        { timeframe: '1h', analysis: '1時間足分析', recommendation: '買い', confidence: 75 },
        { timeframe: '4h', analysis: '4時間足分析', recommendation: '買い', confidence: 85 },
        { timeframe: '1d', analysis: '日足分析', recommendation: '買い', confidence: 90 }
      ],
      summary: 'テスト総合分析',
      overallRecommendation: '買いを推奨',
      overallConfidence: 80
    });
    
    // エントリー提案ツールのモック応答を設定
    (entrySuggestionTool.execute as jest.Mock).mockResolvedValue({
      side: 'buy' as TradeSide,
      price: 50000,
      stopLoss: 49000,
      takeProfit: 52000,
      riskRewardRatio: 2.0,
      confidence: 85,
      rationale: 'テスト根拠',
      imageId: 'test-entry-image',
      entryId: 'test-entry-id'
    });
  });

  it('should successfully complete workflow when both analysis and entry suggestion succeed', async () => {
    // テスト実行
    const result = await entrySuggestionWorkflow({
      timeframes: ['15m', '1h', '4h', '1d'],
      symbol: 'BTCUSDT',
      riskLevel: 'medium'
    });
    
    // 期待される結果を確認
    expect(result).toEqual({
      success: true,
      timeframes: ['15m', '1h', '4h', '1d'],
      analyses: expect.any(Array),
      summary: 'テスト総合分析',
      side: 'buy' as TradeSide,
      price: 50000,
      stopLoss: 49000,
      takeProfit: 52000,
      riskRewardRatio: 2.0,
      confidence: 85,
      rationale: 'テスト根拠',
      imageId: 'test-entry-image',
      entryId: 'test-entry-id'
    });
    
    // ワークフローとツールが正しく呼び出されたことを確認
    expect(multiTimeframeAnalysisWorkflow).toHaveBeenCalledWith({
      timeframes: ['15m', '1h', '4h', '1d'],
      symbol: 'BTCUSDT'
    });
    
    expect(entrySuggestionTool.execute).toHaveBeenCalledWith({
      context: {
        analyses: expect.any(Array),
        summary: 'テスト総合分析',
        overallRecommendation: '買いを推奨',
        overallConfidence: 80,
        riskLevel: 'medium'
      },
      runtimeContext: {}
    });
    
    // ロガーが正しく呼び出されたことを確認
    expect(logger.info).toHaveBeenCalledTimes(4); // ワークフロー開始、分析ステップ、提案ステップ、成功ログ
  });

  it('should use default risk level when not provided', async () => {
    // テスト実行（riskLevelパラメータを省略）
    await entrySuggestionWorkflow({
      timeframes: ['1h', '4h'],
      symbol: 'ETHUSDT'
    });
    
    // デフォルトのリスクレベルが使用されたことを確認
    expect(entrySuggestionTool.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          riskLevel: 'medium' // デフォルト値
        })
      })
    );
  });

  it('should handle analysis workflow failure', async () => {
    // 複数時間足分析の失敗をシミュレート
    (multiTimeframeAnalysisWorkflow as jest.Mock).mockResolvedValue({
      success: false,
      error: '複数時間足分析に失敗しました',
      timeframes: ['15m', '1h', '4h', '1d']
    });
    
    // テスト実行
    const result = await entrySuggestionWorkflow({
      timeframes: ['15m', '1h', '4h', '1d'],
      symbol: 'BTCUSDT'
    });
    
    // 期待される結果を確認
    expect(result).toEqual({
      success: false,
      error: '複数時間足分析に失敗しました',
      timeframes: ['15m', '1h', '4h', '1d']
    });
    
    // エントリー提案ツールが呼ばれないことを確認
    expect(entrySuggestionTool.execute).not.toHaveBeenCalled();
    
    // エラーがログに記録されたことを確認
    expect(logger.error).toHaveBeenCalled();
  });

  it('should handle entry suggestion tool error', async () => {
    // エントリー提案ツールの失敗をシミュレート
    (entrySuggestionTool.execute as jest.Mock).mockRejectedValue(
      new Error('エントリー提案中にエラーが発生しました')
    );
    
    // テスト実行
    const result = await entrySuggestionWorkflow({
      timeframes: ['15m', '1h', '4h', '1d']
    });
    
    // 期待される結果を確認
    expect(result).toEqual({
      success: false,
      error: 'エントリー提案中にエラーが発生しました',
      timeframes: ['15m', '1h', '4h', '1d']
    });
    
    // エラーがログに記録されたことを確認
    expect(logger.error).toHaveBeenCalled();
  });

  it('should handle unexpected errors gracefully', async () => {
    // 予期せぬエラーをシミュレート
    (multiTimeframeAnalysisWorkflow as jest.Mock).mockImplementation(() => {
      throw new Error('予期せぬエラー');
    });
    
    // テスト実行
    const result = await entrySuggestionWorkflow({
      timeframes: ['1h', '4h']
    });
    
    // 期待される結果を確認
    expect(result).toEqual({
      success: false,
      error: '予期せぬエラー',
      timeframes: ['1h', '4h']
    });
    
    // エラーがログに記録されたことを確認
    expect(logger.error).toHaveBeenCalled();
  });
});
