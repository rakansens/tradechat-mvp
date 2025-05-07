// src/mastra/tools/multi-timeframe-tools.ts
// 複数時間足でチャートを分析するツールの実装

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { OpenAI } from 'openai';
import { chartCaptureAnalysisTool } from "./chart-capture";
import { changeTimeframeTool } from "./timeframe-tools";

/**
 * 複数の時間足でチャートを分析するツール
 * 各時間足の分析結果を統合して総合的な見解を提供します
 */
export const multiTimeframeAnalysisTool = createTool({
  id: "multi-timeframe-analysis",
  description: `複数の時間足でチャートを分析し、総合的な見解を提供します。
  
  各時間足（例：15分足、1時間足、4時間足、日足）の分析結果を統合して、
  短期・中期・長期のトレンド方向、重要な価格レベル、取引推奨などを提供します。
  
  分析には以下の項目が含まれます：
  - 各時間足の分析結果の共通点と相違点
  - 短期・中期・長期のトレンド方向
  - 重要な価格レベル（サポート/レジスタンス）
  - 取引推奨（買い/売り/様子見）とその根拠
  - 確信度（0-100%）
  
  分析結果と共に各時間足のチャート画像も表示されます。`,
  
  inputSchema: z.object({
    timeframes: z
      .array(z.string())
      .describe("分析する時間足の配列（例：['15m', '1h', '4h', '1d']）"),
    symbol: z
      .string()
      .optional()
      .describe("分析する通貨ペア（例: 'BTCUSDT'）"),
    focusOn: z
      .string()
      .optional()
      .describe("分析の焦点（例: 'トレンド', 'パターン', 'サポートライン'）"),
  }),
  
  outputSchema: z.object({
    analyses: z.array(z.object({
      timeframe: z.string().describe("時間足"),
      analysis: z.string().describe("チャートの分析結果"),
      recommendation: z.string().describe("分析に基づく取引推奨"),
      confidence: z.number().describe("推奨の確信度（0-100）"),
      imageId: z.string().describe("チャート画像のID"),
    })).describe("各時間足の分析結果"),
    summary: z.string().describe("複数時間足の分析結果をまとめた総合的な見解"),
    overallRecommendation: z.string().describe("総合的な取引推奨"),
    overallConfidence: z.number().describe("総合的な確信度（0-100）"),
  }),
  
  execute: async ({ context }) => {
    try {
      const { timeframes = ['15m', '1h', '4h', '1d'], symbol, focusOn } = context;
      const results = [];
      
      console.log(`複数時間足分析を開始: ${timeframes.join(', ')}`);
      
      // 各時間足ごとに分析を実行
      for (const timeframe of timeframes) {
        console.log(`時間足${timeframe}の分析を開始`);
        
        // 1. 時間足を変更
        const timeframeResult = await changeTimeframeTool.execute({
          context: { timeframe }
        } as any);
        
        if (!timeframeResult.success) {
          console.error(`時間足${timeframe}への変更に失敗しました`);
          continue;
        }
        
        // 少し待機して、チャートが更新されるのを待つ
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 2. チャートをキャプチャして分析
        const analysisResult = await chartCaptureAnalysisTool.execute({
          context: { focusOn }
        } as any);
        
        results.push({
          timeframe,
          analysis: analysisResult.analysis,
          recommendation: analysisResult.recommendation,
          confidence: analysisResult.confidence,
          imageId: analysisResult.imageId,
        });
        
        console.log(`時間足${timeframe}の分析完了`);
      }
      
      // 分析結果がない場合はエラーを返す
      if (results.length === 0) {
        console.error('すべての時間足の分析に失敗しました');
        return {
          analyses: [],
          summary: "分析中にエラーが発生しました。時間足の変更に失敗した可能性があります。",
          overallRecommendation: "エラーのため推奨できません。",
          overallConfidence: 0
        };
      }
      
      // 複数の時間足の分析結果を統合
      console.log('複数時間足の分析結果を統合中...');
      const summary = await combineAnalyses(results);
      const { overallRecommendation, overallConfidence } = generateOverallRecommendation(results);
      
      console.log('複数時間足分析完了');
      
      return {
        analyses: results,
        summary,
        overallRecommendation,
        overallConfidence
      };
    } catch (error) {
      console.error("複数時間足分析エラー:", error);
      return {
        analyses: [],
        summary: "分析中にエラーが発生しました。",
        overallRecommendation: "エラーのため推奨できません。",
        overallConfidence: 0
      };
    }
  },
});

/**
 * 分析結果を組み合わせる関数
 * @param analyses 各時間足の分析結果
 * @returns 統合された分析結果
 */
async function combineAnalyses(analyses: Array<{
  timeframe: string;
  analysis: string;
  recommendation: string;
  confidence: number;
  imageId: string;
}>) {
  try {
    // OpenAI APIを使用して複数の分析結果を統合
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
    
    const analysisTexts = analyses.map(a => 
      `【${a.timeframe}】\n${a.analysis}\n推奨: ${a.recommendation}\n確信度: ${a.confidence}%`
    ).join('\n\n');
    
    const prompt = `
      以下は異なる時間足での同じ通貨ペアのチャート分析結果です。
      これらの分析結果を統合して、総合的な市場見解を提供してください。
      
      ${analysisTexts}
      
      【総合分析】
      1. 各時間足の分析結果の共通点と相違点
      2. 短期・中期・長期のトレンド方向
      3. 重要な価格レベル（サポート/レジスタンス）
      4. 取引推奨（買い/売り/様子見）とその根拠
      5. 確信度（0-100%）
      
      具体的な数値と明確な根拠を示し、実際に行動できる情報を提供してください。
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: 2000,
    });
    
    return response.choices[0]?.message.content || "分析結果の統合に失敗しました。";
  } catch (error) {
    console.error("分析結果の統合中にエラーが発生:", error);
    return "分析結果の統合中にエラーが発生しました。";
  }
}

/**
 * 総合的な推奨と確信度を生成する関数
 * @param analyses 各時間足の分析結果
 * @returns 総合的な推奨と確信度
 */
function generateOverallRecommendation(analyses: Array<{
  timeframe: string;
  analysis: string;
  recommendation: string;
  confidence: number;
  imageId: string;
}>) {
  // 各時間足の推奨と確信度を重み付けして統合
  // 長期足ほど重みを大きくする
  const weights = {
    '1m': 0.1,
    '5m': 0.2,
    '15m': 0.3,
    '30m': 0.4,
    '1h': 0.5,
    '4h': 0.7,
    '1d': 1.0,
    '1w': 1.2
  };
  
  let buyScore = 0;
  let sellScore = 0;
  let totalWeight = 0;
  let totalConfidence = 0;
  
  for (const analysis of analyses) {
    const weight = weights[analysis.timeframe as keyof typeof weights] || 0.5;
    totalWeight += weight;
    totalConfidence += analysis.confidence * weight;
    
    if (analysis.recommendation.includes('買い')) {
      buyScore += weight * analysis.confidence / 100;
    } else if (analysis.recommendation.includes('売り')) {
      sellScore += weight * analysis.confidence / 100;
    }
  }
  
  const overallConfidence = Math.round(totalConfidence / totalWeight);
  
  let overallRecommendation = "様子見を推奨";
  if (buyScore > sellScore && buyScore > 0.5) {
    overallRecommendation = "買いポジションの検討を推奨";
  } else if (sellScore > buyScore && sellScore > 0.5) {
    overallRecommendation = "売りポジションの検討を推奨";
  }
  
  return {
    overallRecommendation,
    overallConfidence
  };
}
