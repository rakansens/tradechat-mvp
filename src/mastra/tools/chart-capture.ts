// src/mastra/tools/chart-capture.ts
// チャートキャプチャツールの実装 - Socket.ioを使用

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { analyzeChartWithAI } from "../../../utils/aiUtils";

// グローバル関数の型定義
declare global {
  var requestCapture: (timeoutMs?: number) => Promise<string | null>;
}

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
      console.log("チャートキャプチャツール実行開始", context);
      
      // Socket.ioを使ってクライアントにキャプチャをリクエスト
      let imageData: string | null = null;
      
      if (typeof global.requestCapture === 'function') {
        console.log("Socket.ioでキャプチャをリクエスト");
        // 15秒のタイムアウトでリクエスト
        imageData = await global.requestCapture(15000);
      } else {
        throw new Error("Socket.ioキャプチャ機能が利用できません");
      }
      
      if (!imageData) {
        throw new Error("チャートのキャプチャに失敗しました");
      }
      
      console.log("キャプチャ成功、AIでの分析を開始");
      
      // OpenAI Vision APIで画像を分析
      const aiAnalysis = await analyzeChartWithAI(imageData, context.focusOn);
      
      return {
        analysis: aiAnalysis.analysis,
        recommendation: aiAnalysis.recommendation,
        confidence: aiAnalysis.confidence,
      };
    } catch (error) {
      console.error("チャートキャプチャ分析エラー:", error);
      
      // エラー時は一般的な分析結果を返す
      return {
        analysis: `チャート分析中にエラーが発生しました: ${error}`,
        recommendation: "現在データが取得できないため、取引判断は保留することをお勧めします。",
        confidence: 0,
      };
    }
  },
}); 