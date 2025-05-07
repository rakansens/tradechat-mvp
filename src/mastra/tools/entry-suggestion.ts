// src/mastra/tools/entry-suggestion.ts
// 作成: チャート分析結果に基づいてエントリー提案を生成するツール

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { multiTimeframeAnalysisTool } from "./multi-timeframe-tools";
import type { TradeSide } from "@/types/entry";

/**
 * チャート分析結果に基づいてエントリー提案を生成するツール
 * 具体的なエントリーポイント、ストップロス、利確目標を計算して提案します
 */
export const entrySuggestionTool = createTool({
  id: "entry-suggestion",
  description: `チャート分析結果に基づいてエントリー提案を生成します。
  
  複数時間足の分析結果を入力として、以下の情報を含むエントリー提案を生成します：
  - 取引方向（買い/売り）
  - エントリーポイント（価格）
  - ストップロス価格
  - 利確目標価格
  - リスク/リワード比
  - 提案の根拠となる分析結果の要約
  - 確信度（0-100%）
  
  提案はチャットUIに表示され、ユーザーはワンクリックでエントリーを実行できます。`,
  
  inputSchema: z.object({
    analysisResult: z.object({
      analyses: z.array(z.object({
        timeframe: z.string(),
        analysis: z.string(),
        recommendation: z.string(),
        confidence: z.number(),
        imageId: z.string(),
      })),
      summary: z.string(),
      overallRecommendation: z.string(),
      overallConfidence: z.number(),
    }).optional().describe("複数時間足分析の結果（省略時は自動的に分析を実行）"),
    timeframes: z
      .array(z.string())
      .optional()
      .describe("分析する時間足の配列（例：['15m', '1h', '4h', '1d']）"),
    symbol: z
      .string()
      .optional()
      .describe("分析する通貨ペア（例: 'BTCUSDT'）"),
    currentPrice: z
      .number()
      .optional()
      .describe("現在の価格（省略時は分析から推定）"),
  }),
  
  outputSchema: z.object({
    side: z.string().describe("取引方向（'buy'または'sell'）"),
    price: z.number().describe("エントリー価格"),
    stopLoss: z.number().describe("ストップロス価格"),
    takeProfit: z.number().describe("利確目標価格"),
    riskRewardRatio: z.number().describe("リスク/リワード比"),
    rationale: z.string().describe("提案の根拠"),
    confidence: z.number().describe("確信度（0-100）"),
    imageId: z.string().optional().describe("関連するチャート画像のID"),
    entryId: z.string().describe("エントリー提案の一意識別子"),
  }),
  
  execute: async ({ context }) => {
    try {
      let analysisResult = context.analysisResult;
      const { timeframes = ['15m', '1h', '4h', '1d'], symbol, currentPrice } = context;
      
      console.log('エントリー提案ツールを実行中...');
      
      // 分析結果が提供されていない場合は、マルチタイムフレーム分析を実行
      if (!analysisResult) {
        console.log('分析結果が提供されていないため、マルチタイムフレーム分析を実行します');
        analysisResult = await multiTimeframeAnalysisTool.execute({
          context: { timeframes, symbol }
        } as any);
      }
      
      // 分析結果からエントリー提案を生成
      console.log('分析結果からエントリー提案を生成中...');
      const suggestion = await generateEntrySuggestion(analysisResult, currentPrice);
      
      console.log('エントリー提案生成完了');
      return {
        ...suggestion,
        entryId: uuidv4(), // 一意のエントリーIDを生成
      };
    } catch (error) {
      console.error("エントリー提案生成エラー:", error);
      return {
        side: "buy",
        price: 0,
        stopLoss: 0,
        takeProfit: 0,
        riskRewardRatio: 0,
        rationale: "エントリー提案の生成中にエラーが発生しました。",
        confidence: 0,
        entryId: uuidv4(),
      };
    }
  },
});

/**
 * 分析結果からエントリー提案を生成する関数
 * @param analysisResult 複数時間足分析の結果
 * @param currentPrice 現在の価格（省略時は分析から推定）
 * @returns エントリー提案
 */
async function generateEntrySuggestion(
  analysisResult: any,
  currentPrice?: number
): Promise<{
  side: TradeSide;
  price: number;
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  rationale: string;
  confidence: number;
  imageId?: string;
}> {
  try {
    // OpenAI APIを使用してエントリー提案を生成
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });
    
    // 分析結果をテキストに変換
    const analysisTexts = analysisResult.analyses.map((a: any) => 
      `【${a.timeframe}】\n${a.analysis}\n推奨: ${a.recommendation}\n確信度: ${a.confidence}%`
    ).join('\n\n');
    
    // 現在価格の推定（提供されていない場合）
    let estimatedPrice = currentPrice;
    if (!estimatedPrice) {
      // 分析テキストから価格情報を抽出する試み
      const priceMatch = analysisResult.summary.match(/現在価格[は:]?\s*([0-9,.]+)/i);
      if (priceMatch && priceMatch[1]) {
        estimatedPrice = parseFloat(priceMatch[1].replace(/,/g, ''));
      } else {
        // デフォルト値（実際の実装では適切な方法で現在価格を取得する必要がある）
        estimatedPrice = 50000; // 仮の価格
      }
    }
    
    const prompt = `
      以下は複数時間足での同じ通貨ペアのチャート分析結果です。
      この分析結果に基づいて、具体的なエントリー提案を生成してください。
      
      【分析結果】
      ${analysisTexts}
      
      【総合分析】
      ${analysisResult.summary}
      
      【総合推奨】
      ${analysisResult.overallRecommendation}
      確信度: ${analysisResult.overallConfidence}%
      
      【現在価格】
      ${estimatedPrice}
      
      以下の形式でエントリー提案を生成してください：
      
      1. 取引方向（買い/売り）: [buy/sell]
      2. エントリー価格: [具体的な価格]
      3. ストップロス価格: [具体的な価格]
      4. 利確目標価格: [具体的な価格]
      5. リスク/リワード比: [計算値]
      6. 提案の根拠: [簡潔な説明]
      7. 確信度（0-100）: [数値]
      
      重要なポイント：
      - 現在価格と近い現実的なエントリーポイントを提案してください
      - ストップロスは重要なサポート/レジスタンスレベルに基づいて設定してください
      - 利確目標は過去の価格行動と現在のトレンドに基づいて設定してください
      - リスク/リワード比は少なくとも1:2以上を目指してください
      - 確信度は分析結果の一貫性と明確さに基づいて設定してください
      
      JSONフォーマットで回答してください。
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });
    
    const content = response.choices[0]?.message.content || "{}";
    let result;
    
    try {
      result = JSON.parse(content);
    } catch (e) {
      console.error("JSONのパースに失敗:", e);
      // 正規表現でJSONっぽい部分を抽出する試み
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch (e2) {
          console.error("抽出したJSONのパースにも失敗:", e2);
          throw new Error("エントリー提案の生成に失敗しました");
        }
      } else {
        throw new Error("エントリー提案の生成に失敗しました");
      }
    }
    
    // 結果の整形と検証
    const side = (result.side || result["取引方向"] || "buy").toLowerCase() as TradeSide;
    const price = parseFloat(result.price || result["エントリー価格"] || estimatedPrice);
    const stopLoss = parseFloat(result.stopLoss || result["ストップロス価格"] || (side === "buy" ? price * 0.95 : price * 1.05));
    const takeProfit = parseFloat(result.takeProfit || result["利確目標価格"] || (side === "buy" ? price * 1.1 : price * 0.9));
    
    // リスク/リワード比の計算
    const risk = Math.abs(price - stopLoss);
    const reward = Math.abs(price - takeProfit);
    const riskRewardRatio = risk > 0 ? parseFloat((reward / risk).toFixed(2)) : 0;
    
    const confidence = parseInt(result.confidence || result["確信度"] || analysisResult.overallConfidence);
    const rationale = result.rationale || result["提案の根拠"] || "分析結果に基づく提案";
    
    // 最新の時間足のチャート画像IDを使用
    const imageId = analysisResult.analyses.length > 0 ? analysisResult.analyses[0].imageId : undefined;
    
    return {
      side,
      price,
      stopLoss,
      takeProfit,
      riskRewardRatio,
      rationale,
      confidence,
      imageId,
    };
  } catch (error) {
    console.error("エントリー提案の生成中にエラーが発生:", error);
    return {
      side: "buy",
      price: 0,
      stopLoss: 0,
      takeProfit: 0,
      riskRewardRatio: 0,
      rationale: "エントリー提案の生成中にエラーが発生しました。",
      confidence: 0,
    };
  }
}
