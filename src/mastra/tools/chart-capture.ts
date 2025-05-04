// src/mastra/tools/chart-capture.ts
// チャートキャプチャツールの実装

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { captureChartAsBase64 } from "../../../utils/screenshotUtils";
import { analyzeChartWithAI } from "../../../utils/aiUtils";

/**
 * 現在表示中のチャートをキャプチャし、AIに分析させるツール
 */
export const chartCaptureAnalysisTool = createTool({
  id: "chart-capture-analysis",
  description: "現在表示されているチャートをキャプチャして分析します。トレンドやパターン、指標の状態などを読み取り、取引判断の材料として使用します。",
  inputSchema: z.object({
    // 追加のパラメータを設定可能（例：分析の焦点）
    focusOn: z
      .string()
      .optional()
      .describe("分析の焦点（例: 'トレンド', 'パターン', 'サポートライン', 'レジスタンスライン'）"),
  }),
  outputSchema: z.object({
    analysis: z.string().describe("チャートの分析結果"),
    recommendation: z.string().describe("分析に基づく取引推奨"),
    confidence: z.number().describe("推奨の確信度（0-100）"),
  }),
  execute: async ({ context }) => {
    try {
      // ブラウザ環境かどうかを確認
      if (typeof window === 'undefined') {
        throw new Error("このツールはブラウザ環境でのみ実行できます");
      }

      // チャートをキャプチャ
      console.log("チャートキャプチャを開始します...");
      const chartImageBase64 = await captureChartAsBase64();
      console.log("チャートキャプチャ完了");
      
      // AI分析の実行
      console.log("AIによるチャート分析を開始します...");
      const analysisResult = await analyzeChartWithAI(chartImageBase64, context.focusOn);
      console.log("チャート分析完了");

      return {
        analysis: analysisResult.analysis,
        recommendation: analysisResult.recommendation,
        confidence: analysisResult.confidence,
      };
    } catch (error) {
      console.error("チャートキャプチャ分析エラー:", error);
      
      // サーバーサイドまたはエラー時のフォールバック
      return {
        analysis: "チャートの分析に失敗しました。このツールはブラウザ環境でのみ動作します。また、OpenAI APIキーが正しく設定されているか確認してください。",
        recommendation: "エラーのため判断できません",
        confidence: 0,
      };
    }
  },
}); 