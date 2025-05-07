// src/mastra/tools/__tests__/multi-timeframe-tools.test.ts
// 複数時間足分析ツールのテスト

import { multiTimeframeAnalysisTool } from '../multi-timeframe-tools';
import { changeTimeframeTool } from '../timeframe-tools';
import { chartCaptureAnalysisTool } from '../chart-capture';

// モックのセットアップ
jest.mock('../timeframe-tools', () => ({
  changeTimeframeTool: {
    execute: jest.fn()
  }
}));

jest.mock('../chart-capture', () => ({
  chartCaptureAnalysisTool: {
    execute: jest.fn()
  }
}));

jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: '複数時間足の分析結果を統合した総合的な見解'
                  }
                }
              ]
            })
          }
        }
      };
    })
  };
});

describe('multiTimeframeAnalysisTool', () => {
  // テスト前の準備
  beforeEach(() => {
    jest.clearAllMocks();
    
    // モックの戻り値を設定
    (changeTimeframeTool.execute as jest.Mock).mockResolvedValue({
      success: true,
      timeframe: '1h'
    });
    
    (chartCaptureAnalysisTool.execute as jest.Mock).mockResolvedValue({
      analysis: 'チャート分析結果',
      recommendation: '買いポジションの検討を推奨',
      confidence: 85,
      imageId: 'test-image-id',
      imageCaption: 'テスト画像'
    });
    
    // コンソールログのモック
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  // テスト後のクリーンアップ
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('ツールが正しく定義されている', () => {
    // 検証
    expect(multiTimeframeAnalysisTool).toHaveProperty('id', 'multi-timeframe-analysis');
    expect(multiTimeframeAnalysisTool).toHaveProperty('description');
    expect(multiTimeframeAnalysisTool).toHaveProperty('inputSchema');
    expect(multiTimeframeAnalysisTool).toHaveProperty('outputSchema');
    expect(multiTimeframeAnalysisTool).toHaveProperty('execute');
  });

  it('正常系：複数時間足の分析を実行して結果を返す', async () => {
    // セットアップ
    const timeframes = ['15m', '1h', '4h'];
    
    // 実行
    const result = await multiTimeframeAnalysisTool.execute({
      context: { 
        timeframes,
        symbol: 'BTCUSDT',
        focusOn: 'トレンド'
      }
    } as any);
    
    // 検証
    expect(changeTimeframeTool.execute).toHaveBeenCalledTimes(timeframes.length);
    expect(chartCaptureAnalysisTool.execute).toHaveBeenCalledTimes(timeframes.length);
    
    // 各時間足ごとに正しく呼び出されたか
    timeframes.forEach(timeframe => {
      expect(changeTimeframeTool.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          context: { timeframe }
        })
      );
    });
    
    // 結果の構造を検証
    expect(result).toHaveProperty('analyses');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('overallRecommendation');
    expect(result).toHaveProperty('overallConfidence');
    
    // 分析結果の数が時間足の数と一致するか
    expect(result.analyses).toHaveLength(timeframes.length);
    
    // 各分析結果の構造を検証
    result.analyses.forEach((analysis: any) => {
      expect(analysis).toHaveProperty('timeframe');
      expect(analysis).toHaveProperty('analysis');
      expect(analysis).toHaveProperty('recommendation');
      expect(analysis).toHaveProperty('confidence');
      expect(analysis).toHaveProperty('imageId');
    });
  });

  it('時間足変更に失敗した場合もエラーハンドリングを行う', async () => {
    // セットアップ: 時間足変更の失敗をシミュレート
    (changeTimeframeTool.execute as jest.Mock).mockResolvedValue({
      success: false,
      timeframe: '1h'
    });
    
    // 実行
    const result = await multiTimeframeAnalysisTool.execute({
      context: { 
        timeframes: ['15m', '1h', '4h'],
        focusOn: 'トレンド'
      }
    } as any);
    
    // 検証
    expect(result).toHaveProperty('analyses');
    expect(result.analyses).toHaveLength(0);
    expect(result.summary).toContain('エラー');
    expect(result.overallRecommendation).toContain('エラー');
    expect(result.overallConfidence).toBe(0);
    expect(console.error).toHaveBeenCalled();
  });

  it('例外が発生した場合もエラーハンドリングを行う', async () => {
    // セットアップ: 例外をスローするようにモックを設定
    (changeTimeframeTool.execute as jest.Mock).mockRejectedValue(new Error('テストエラー'));
    
    // 実行
    const result = await multiTimeframeAnalysisTool.execute({
      context: { 
        timeframes: ['15m', '1h', '4h'],
        focusOn: 'トレンド'
      }
    } as any);
    
    // 検証
    expect(result).toHaveProperty('analyses');
    expect(result.analyses).toHaveLength(0);
    expect(result.summary).toContain('エラー');
    expect(result.overallRecommendation).toContain('エラー');
    expect(result.overallConfidence).toBe(0);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('複数時間足分析エラー'), expect.any(Error));
  });
});
