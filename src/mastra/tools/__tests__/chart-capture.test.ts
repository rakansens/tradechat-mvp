// src/mastra/tools/__tests__/chart-capture.test.ts
// チャートキャプチャツールのテスト

import { chartCaptureAnalysisTool } from '../chart-capture';
import { captureChartAsBase64 } from '../../../../utils/screenshotUtils';
import { analyzeChartWithAI } from '../../../../utils/aiUtils';

// モックのセットアップ
jest.mock('../../../../utils/screenshotUtils', () => ({
  captureChartAsBase64: jest.fn()
}));

jest.mock('../../../../utils/aiUtils', () => ({
  analyzeChartWithAI: jest.fn()
}));

describe('chartCaptureAnalysisTool', () => {
  // モックの参照を取得
  const mockCaptureChart = captureChartAsBase64 as jest.Mock;
  const mockAnalyzeChart = analyzeChartWithAI as jest.Mock;

  // テスト前の準備
  beforeEach(() => {
    // windowオブジェクトのモック
    global.window = {} as any;
    
    // モックをリセット
    mockCaptureChart.mockReset();
    mockAnalyzeChart.mockReset();
    jest.clearAllMocks();
    
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
    expect(chartCaptureAnalysisTool).toHaveProperty('id', 'chart-capture-analysis');
    expect(chartCaptureAnalysisTool).toHaveProperty('description');
    expect(chartCaptureAnalysisTool).toHaveProperty('inputSchema');
    expect(chartCaptureAnalysisTool).toHaveProperty('outputSchema');
    expect(chartCaptureAnalysisTool).toHaveProperty('execute');
  });

  it('正常系：チャートをキャプチャして分析結果を返す', async () => {
    // セットアップ
    const mockImageData = 'mock-base64-image-data';
    const mockAnalysisResult = {
      analysis: 'チャート分析結果',
      recommendation: '買いポジションの検討を推奨',
      confidence: 85
    };
    
    mockCaptureChart.mockResolvedValue(mockImageData);
    mockAnalyzeChart.mockResolvedValue(mockAnalysisResult);
    
    // 実行
    const result = await chartCaptureAnalysisTool.execute({
      context: { focusOn: 'トレンド' }
    } as any);
    
    // 検証
    expect(mockCaptureChart).toHaveBeenCalled();
    expect(mockAnalyzeChart).toHaveBeenCalledWith(mockImageData, 'トレンド');
    expect(result).toEqual(mockAnalysisResult);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('チャートキャプチャを開始'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('チャートキャプチャ完了'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('AIによるチャート分析を開始'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('チャート分析完了'));
  });

  it('ブラウザ環境以外で実行するとエラーを返す', async () => {
    // セットアップ: windowをundefinedに設定
    global.window = undefined as any;
    
    // 実行
    const result = await chartCaptureAnalysisTool.execute({
      context: {}
    } as any);
    
    // 検証
    expect(result).toEqual({
      analysis: expect.stringContaining('ブラウザ環境でのみ動作します'),
      recommendation: 'エラーのため判断できません',
      confidence: 0
    });
    expect(mockCaptureChart).not.toHaveBeenCalled();
    expect(mockAnalyzeChart).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('チャートキャプチャ分析エラー'), expect.anything());
  });

  it('キャプチャ中にエラーが発生した場合はエラーメッセージを返す', async () => {
    // セットアップ: キャプチャエラー
    mockCaptureChart.mockRejectedValue(new Error('キャプチャエラー'));
    
    // 実行
    const result = await chartCaptureAnalysisTool.execute({
      context: {}
    } as any);
    
    // 検証
    expect(result).toEqual({
      analysis: expect.stringContaining('チャートの分析に失敗'),
      recommendation: 'エラーのため判断できません',
      confidence: 0
    });
    expect(mockCaptureChart).toHaveBeenCalled();
    expect(mockAnalyzeChart).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('チャートキャプチャ分析エラー'), expect.any(Error));
  });

  it('AI分析中にエラーが発生した場合もエラーハンドリングを行う', async () => {
    // セットアップ: キャプチャは成功するがAI分析で失敗
    const mockImageData = 'mock-base64-image-data';
    mockCaptureChart.mockResolvedValue(mockImageData);
    mockAnalyzeChart.mockRejectedValue(new Error('AI分析エラー'));
    
    // 実行
    const result = await chartCaptureAnalysisTool.execute({
      context: {}
    } as any);
    
    // 検証
    expect(result).toEqual({
      analysis: expect.stringContaining('チャートの分析に失敗'),
      recommendation: 'エラーのため判断できません',
      confidence: 0
    });
    expect(mockCaptureChart).toHaveBeenCalled();
    expect(mockAnalyzeChart).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('チャートキャプチャ分析エラー'), expect.any(Error));
  });
}); 