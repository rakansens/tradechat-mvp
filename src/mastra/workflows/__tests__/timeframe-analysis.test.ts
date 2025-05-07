// src/mastra/workflows/__tests__/timeframe-analysis.test.ts
// 作成: 複数時間足分析ワークフローのテスト実装

import { multiTimeframeAnalysisWorkflow } from '@/src/mastra/workflows/timeframe-analysis';
import { multiTimeframeAnalysisTool } from '@/src/mastra/tools/multi-timeframe-tools';
import { logger } from '@/utils/logger';

// 必要なモック
jest.mock('@/src/mastra/tools/multi-timeframe-tools', () => ({
  multiTimeframeAnalysisTool: {
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

describe('multiTimeframeAnalysisWorkflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // デフォルトのモック応答を設定
    (multiTimeframeAnalysisTool.execute as jest.Mock).mockResolvedValue({
      analyses: [
        {
          timeframe: '15m',
          analysis: '15分足分析結果',
          recommendation: '様子見',
          confidence: 60,
          imageId: 'test-image-15m'
        },
        {
          timeframe: '1h',
          analysis: '1時間足分析結果',
          recommendation: '買い',
          confidence: 75,
          imageId: 'test-image-1h'
        },
        {
          timeframe: '4h',
          analysis: '4時間足分析結果',
          recommendation: '買い',
          confidence: 85,
          imageId: 'test-image-4h'
        },
        {
          timeframe: '1d',
          analysis: '日足分析結果',
          recommendation: '強い買い',
          confidence: 90,
          imageId: 'test-image-1d'
        }
      ],
      summary: 'テスト総合分析',
      overallRecommendation: '買いを推奨',
      overallConfidence: 80
    });
  });

  it('should successfully complete workflow when tools succeed', async () => {
    // テスト実行
    const result = await multiTimeframeAnalysisWorkflow({
      timeframes: ['15m', '1h', '4h', '1d'],
      symbol: 'BTCUSDT',
      focusOn: 'トレンド'
    });
    
    // 期待される結果を確認
    expect(result).toEqual({
      success: true,
      timeframes: ['15m', '1h', '4h', '1d'],
      analyses: expect.any(Array),
      summary: 'テスト総合分析',
      overallRecommendation: '買いを推奨',
      overallConfidence: 80
    });
    
    // ツールが正しく呼び出されたことを確認
    expect(multiTimeframeAnalysisTool.execute).toHaveBeenCalledWith({
      context: { 
        timeframes: ['15m', '1h', '4h', '1d'],
        symbol: 'BTCUSDT',
        focusOn: 'トレンド'
      },
      runtimeContext: {}
    });
    
    // ロガーが正しく呼び出されたことを確認
    expect(logger.info).toHaveBeenCalledTimes(3); // ワークフロー開始、ステップ実行、成功ログ
  });

  it('should use default timeframes when not provided', async () => {
    // テスト実行（timeframesパラメータを省略）
    const result = await multiTimeframeAnalysisWorkflow({
      symbol: 'ETHUSDT'
    });
    
    // デフォルトの時間足が使用されたことを確認
    expect(multiTimeframeAnalysisTool.execute).toHaveBeenCalledWith({
      context: { 
        timeframes: ['15m', '1h', '4h', '1d'], // デフォルト値
        symbol: 'ETHUSDT',
        focusOn: undefined
      },
      runtimeContext: {}
    });
    
    // 期待される結果を確認
    expect(result.success).toBe(true);
    expect(result.timeframes).toEqual(['15m', '1h', '4h', '1d']);
  });

  it('should handle analysis tool error', async () => {
    // 複数時間足分析の失敗をシミュレート
    (multiTimeframeAnalysisTool.execute as jest.Mock).mockRejectedValue(
      new Error('複数時間足分析中にエラーが発生しました')
    );
    
    // テスト実行
    const result = await multiTimeframeAnalysisWorkflow({
      timeframes: ['15m', '1h', '4h', '1d']
    });
    
    // 期待される結果を確認
    expect(result).toEqual({
      success: false,
      error: '複数時間足分析中にエラーが発生しました',
      timeframes: ['15m', '1h', '4h', '1d']
    });
    
    // エラーがログに記録されたことを確認
    expect(logger.error).toHaveBeenCalled();
  });

  it('should handle unexpected errors gracefully', async () => {
    // 予期せぬエラーをシミュレート
    (multiTimeframeAnalysisTool.execute as jest.Mock).mockImplementation(() => {
      throw new Error('予期せぬエラー');
    });
    
    // テスト実行
    const result = await multiTimeframeAnalysisWorkflow({
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
