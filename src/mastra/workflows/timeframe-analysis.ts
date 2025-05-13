// src/mastra/workflows/timeframe-analysis.ts
// 更新: 複数時間足分析ワークフローを型安全で堅牢な実装に変更

import { multiTimeframeAnalysisTool } from "../tools/multi-timeframe-tools";
import { logger } from "../../../utils/common";

// 入力パラメータの型定義
export interface MultiTimeframeAnalysisParams {
  timeframes?: string[];
  symbol?: string;
  focusOn?: string;
}

// 結果の型定義
export interface MultiTimeframeAnalysisResult {
  success: boolean;
  timeframes: string[];
  analyses?: any[];
  summary?: string;
  overallRecommendation?: string;
  overallConfidence?: number;
  error?: string;
}

/**
 * 複数時間足分析ワークフロー
 * 複数の時間足でチャートを分析し、総合的な見解を提供します
 * 
 * @param params ワークフローのパラメータ
 * @returns 分析結果
 */
export async function multiTimeframeAnalysisWorkflow(params: MultiTimeframeAnalysisParams): Promise<MultiTimeframeAnalysisResult> {
  // デフォルト値を持つパラメータを展開
  const { timeframes = ['15m', '1h', '4h', '1d'], symbol, focusOn } = params;
  
  // ワークフロー開始をログに記録
  logger.info(`複数時間足分析ワークフローを開始: ${timeframes.join(', ')}`, {
    workflow: 'multiTimeframeAnalysis',
    params: { timeframes, symbol, focusOn }
  });
  
  try {
    // 複数時間足分析ツールを実行
    logger.info(`複数時間足分析ツールを実行`, {
      workflow: 'multiTimeframeAnalysis',
      step: 'executeMultiTimeframeAnalysis'
    });
    
    const result = await multiTimeframeAnalysisTool.execute({
      context: { timeframes, symbol, focusOn },
      runtimeContext: {}
    } as any); // as anyを使用して型互換性問題を回避
    
    // 成功結果をログ記録
    logger.info(`複数時間足分析が成功: ${timeframes.join(', ')}`, {
      workflow: 'multiTimeframeAnalysis',
      status: 'success',
      resultSummary: {
        analysesCount: result.analyses?.length,
        overallConfidence: result.overallConfidence
      }
    });
    
    return {
      success: true,
      timeframes,
      analyses: result.analyses,
      summary: result.summary,
      overallRecommendation: result.overallRecommendation,
      overallConfidence: result.overallConfidence
    };
  } catch (error: any) { // エラーの型を明示的に指定
    // 全てのエラーを共通処理
    const errorMessage = error?.message || "複数時間足分析中に不明なエラーが発生しました";
    
    logger.error(`複数時間足分析ワークフローエラー: ${errorMessage}`, {
      workflow: 'multiTimeframeAnalysis',
      error,
      timeframes
    });
    
    return {
      success: false,
      error: errorMessage,
      timeframes: timeframes
    };
  }
}
