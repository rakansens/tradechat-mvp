// src/mastra/workflows/chart-analysis.ts
// 更新: チャート分析ワークフローを型安全で堅牢な実装に変更

import { z } from "zod";
import { chartCaptureAnalysisTool } from "../tools/chart-capture";
import { changeTimeframeTool } from "../tools/timeframe-tools";
import { logger } from "../../../utils/logger";

// 入力パラメータの型定義
export interface TimeframeAnalysisParams {
  timeframe: string;
  symbol?: string;
  focusOn?: string;
}

// 結果の型定義
export interface TimeframeAnalysisResult {
  success: boolean;
  timeframe: string;
  analysis?: string;
  recommendation?: string;
  confidence?: number;
  imageId?: string;
  error?: string;
}

/**
 * 単一時間足分析ワークフロー
 * 指定された時間足のチャートを分析します
 * 
 * @param params ワークフローのパラメータ
 * @returns 分析結果
 */
export async function analyzeTimeframeWorkflow(params: TimeframeAnalysisParams): Promise<TimeframeAnalysisResult> {
  // ワークフロー開始をログに記録
  logger.info(`時間足分析ワークフローを開始: ${params.timeframe}`, {
    workflow: 'analyzeTimeframe',
    params
  });
  
  try {
    // ステップ1: 時間足変更
    logger.info(`[ステップ1] 時間足を変更: ${params.timeframe}`, {
      workflow: 'analyzeTimeframe',
      step: 'changeTimeframe'
    });
    
    // ツール実行のためのコンテキストを正しい形式で構築
    const timeframeResult = await changeTimeframeTool.execute({
      context: { timeframe: params.timeframe },
      runtimeContext: {}
    } as any); // as anyを使用して型互換性問題を回避
    
    if (!timeframeResult.success) {
      const errorMsg = `時間足${params.timeframe}への変更に失敗しました`;
      logger.error(errorMsg, {
        workflow: 'analyzeTimeframe',
        step: 'changeTimeframe',
        result: timeframeResult
      });
      
      return {
        success: false,
        timeframe: params.timeframe,
        error: errorMsg
      };
    }
    
    // 少し待機して、チャートが更新されるのを待つ
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // ステップ2: チャートキャプチャと分析
    logger.info(`[ステップ2] チャートキャプチャと分析を実行`, {
      workflow: 'analyzeTimeframe',
      step: 'captureAndAnalyze',
      focusOn: params.focusOn
    });
    
    // ツール実行のためのコンテキストを正しい形式で構築
    const analysisResult = await chartCaptureAnalysisTool.execute({
      context: { focusOn: params.focusOn },
      runtimeContext: {}
    } as any); // as anyを使用して型互換性問題を回避
    
    // 成功結果を返す
    logger.info(`時間足分析ワークフローが成功: ${params.timeframe}`, {
      workflow: 'analyzeTimeframe',
      status: 'success'
    });
    
    return {
      success: true,
      timeframe: params.timeframe,
      analysis: analysisResult.analysis,
      recommendation: analysisResult.recommendation,
      confidence: analysisResult.confidence,
      imageId: analysisResult.imageId
    };
  } catch (error: any) { // エラーの型を明示的に指定
    // 全てのエラーを共通処理
    const errorMessage = error?.message || "チャート分析中に不明なエラーが発生しました";
    
    logger.error(`時間足分析ワークフローエラー: ${errorMessage}`, {
      workflow: 'analyzeTimeframe',
      error
    });
    
    return {
      success: false,
      error: errorMessage,
      timeframe: params.timeframe
    };
  }
}
