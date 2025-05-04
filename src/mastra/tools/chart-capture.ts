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
      
      // キャプチャ失敗時のフォールバック
      const fallbackAnalysis = {
        analysis: "チャートのキャプチャに失敗しました。リロードするか、別のブラウザで試してください。",
        recommendation: "技術的な問題のため分析できません。トレードの判断は控えてください。",
        confidence: 0,
      };
      
      if (typeof global.requestCapture === 'function') {
        console.log("Socket.ioでキャプチャをリクエスト開始");
        
        // 最大5回リトライ（より多くのリトライ）
        for (let attempt = 1; attempt <= 5; attempt++) {
          try {
            console.log(`キャプチャ試行 ${attempt}/5`);
            // タイムアウトを長めに設定（30秒）
            imageData = await global.requestCapture(30000);
            
            if (imageData) {
              console.log("キャプチャ成功、リトライ終了");
              break;
            }
          } catch (captureError) {
            console.error(`キャプチャ試行 ${attempt} 失敗:`, captureError);
            
            if (attempt < 5) {
              // 待機時間を徐々に増やす（指数バックオフ）
              const waitTime = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
              console.log(`${waitTime}ms待機してから再試行します`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        }
        
        // キャプチャに失敗した場合
        if (!imageData) {
          console.error("リトライ後もキャプチャに失敗しました");
          return fallbackAnalysis;
        }
        
        console.log("キャプチャ成功、AIでの分析を開始");
        
        // OpenAI Vision APIで画像を分析
        const aiAnalysis = await analyzeChartWithAI(imageData, context.focusOn);
        
        return {
          analysis: aiAnalysis.analysis,
          recommendation: aiAnalysis.recommendation,
          confidence: aiAnalysis.confidence,
        };
      } else {
        console.error("Socket.ioキャプチャ機能が利用できません");
        return {
          ...fallbackAnalysis,
          analysis: "Socket.ioキャプチャ機能が利用できません。サーバー側の設定を確認してください。"
        };
      }
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