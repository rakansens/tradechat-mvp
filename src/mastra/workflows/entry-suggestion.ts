// src/mastra/workflows/entry-suggestion.ts
// 更新: エントリー提案ワークフローを型安全で堅牢な実装に変更

import { entrySuggestionTool } from "../tools/entry-suggestion";
import { multiTimeframeAnalysisWorkflow, MultiTimeframeAnalysisParams } from "./timeframe-analysis";
import { logger } from "../../../utils/logger";
import { TradeSide } from "@/types/entry";

// 入力パラメータの型定義
export interface EntrySuggestionParams {
  timeframes?: string[];
  symbol?: string;
  riskLevel?: 'low' | 'medium' | 'high';
}

// 結果の型定義
export interface EntrySuggestionResult {
  success: boolean;
  timeframes?: string[];
  analyses?: any[];
  summary?: string;
  side?: TradeSide;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  riskRewardRatio?: number;
  confidence?: number;
  rationale?: string;
  imageId?: string;
  entryId?: string;
  error?: string;
}

/**
 * エントリー提案ワークフロー
 * 複数時間足分析に基づいてエントリーポイントを提案します
 * 
 * @param params ワークフローのパラメータ
 * @returns エントリー提案結果
 */
export async function entrySuggestionWorkflow(params: EntrySuggestionParams): Promise<EntrySuggestionResult> {
  // デフォルト値を持つパラメータを展開
  const { timeframes, symbol, riskLevel = 'medium' } = params;
  
  // ワークフロー開始をログに記録
  logger.info(`エントリー提案ワークフローを開始`, {
    workflow: 'entrySuggestion',
    params: { timeframes, symbol, riskLevel }
  });
  
  try {
    // ステップ1: 複数時間足分析を実行
    logger.info(`[ステップ1] 複数時間足分析を実行`, {
      workflow: 'entrySuggestion',
      step: 'multiTimeframeAnalysis'
    });
    
    const analysisParams: MultiTimeframeAnalysisParams = {
      timeframes,
      symbol
    };
    
    const analysisResult = await multiTimeframeAnalysisWorkflow(analysisParams);
    
    // 分析に失敗した場合は早期にエラー結果を返す
    if (!analysisResult.success) {
      const errorMsg = analysisResult.error || "複数時間足分析に失敗しました";
      
      logger.error(`複数時間足分析に失敗: ${errorMsg}`, {
        workflow: 'entrySuggestion',
        step: 'multiTimeframeAnalysis',
        error: analysisResult.error
      });
      
      return {
        success: false,
        error: errorMsg,
        timeframes: analysisResult.timeframes
      };
    }
    
    // ステップ2: エントリー提案ツールを実行
    logger.info(`[ステップ2] エントリー提案ツールを実行`, {
      workflow: 'entrySuggestion',
      step: 'generateEntrySuggestion',
      riskLevel
    });
    
    const suggestionResult = await entrySuggestionTool.execute({
      context: {
        analyses: analysisResult.analyses,
        summary: analysisResult.summary,
        overallRecommendation: analysisResult.overallRecommendation,
        overallConfidence: analysisResult.overallConfidence,
        riskLevel
      },
      runtimeContext: {}
    } as any); // as anyを使用して型互換性問題を回避
    
    // 成功結果をログ記録
    logger.info(`エントリー提案が成功`, {
      workflow: 'entrySuggestion',
      status: 'success',
      resultSummary: {
        side: suggestionResult.side as TradeSide, // 型アサーションで正しいTradeSide型に変換
        confidence: suggestionResult.confidence,
        riskRewardRatio: suggestionResult.riskRewardRatio
      }
    });
    
    // 成功結果を返す
    return {
      success: true,
      timeframes: analysisResult.timeframes,
      analyses: analysisResult.analyses,
      summary: analysisResult.summary,
      side: suggestionResult.side as TradeSide, // 型アサーションで正しいTradeSide型に変換
      price: suggestionResult.price,
      stopLoss: suggestionResult.stopLoss,
      takeProfit: suggestionResult.takeProfit,
      riskRewardRatio: suggestionResult.riskRewardRatio,
      confidence: suggestionResult.confidence,
      rationale: suggestionResult.rationale,
      imageId: suggestionResult.imageId,
      entryId: suggestionResult.entryId
    };
  } catch (error: any) { // エラーの型を明示的に指定
    // 全てのエラーを共通処理
    const errorMessage = error?.message || "エントリー提案中に不明なエラーが発生しました";
    
    logger.error(`エントリー提案ワークフローエラー: ${errorMessage}`, {
      workflow: 'entrySuggestion',
      error,
      params
    });
    
    return {
      success: false,
      error: errorMessage,
      timeframes: timeframes || ['15m', '1h', '4h', '1d']
    };
  }
}
