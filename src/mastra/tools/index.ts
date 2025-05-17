// src/mastra/tools/index.ts
// 更新：Mem0記憶ツール、チャートキャプチャツール、時間足変更ツール、銘柄変更ツール、エントリー提案ツールをエクスポート
// 長期記憶を検索・保存するためのAIツールと、チャート操作・分析・エントリー提案ツールを実装

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { mem0 } from "../integrations";
import { chartCaptureAnalysisTool, createChartCaptureAnalysisTool } from "./chart-capture";
import { changeTimeframeTool } from "./timeframe-tools";
import { changeSymbolTool } from "./symbol-tools";
import { changeInstrumentTypeTool } from "./instrument-type-tools";
import { multiTimeframeAnalysisTool } from "./multi-timeframe-tools";
import { entrySuggestionTool } from "./entry-suggestion";

/**
 * 過去に保存した記憶を検索するツール
 */
export const mem0RememberTool = createTool({
  id: "mem0-remember",
  description: "過去のチャットや取引内容から関連する記憶を検索します。ユーザーの取引スタイルや優先事項を思い出したい場合に利用してください。",
  inputSchema: z.object({
    question: z
      .string()
      .describe("検索したい内容についての質問や検索キーワード"),
  }),
  outputSchema: z.object({
    answer: z.string().describe("検索結果として見つかった記憶内容"),
  }),
  execute: async ({ context }) => {
    const memory = await mem0.searchMemory(context.question);
    return {
      answer: memory || "関連する記憶は見つかりませんでした。",
    };
  },
});

/**
 * 重要な情報を長期記憶に保存するツール
 */
export const mem0MemorizeTool = createTool({
  id: "mem0-memorize",
  description: "重要な取引情報や傾向、ユーザー優先事項を長期記憶に保存します。後で「mem0-remember」ツールで検索できます。",
  inputSchema: z.object({
    statement: z.string().describe("記憶として保存したい重要な情報"),
  }),
  outputSchema: z.object({
    success: z.boolean().describe("保存が成功したかどうか"),
  }),
  execute: async ({ context }) => {
    try {
      await mem0.createMemory(context.statement);
      return { success: true };
    } catch (error) {
      console.error("Memory creation failed:", error);
      return { success: false };
    }
  },
});

// チャート関連ツールをエクスポート
export { 
  chartCaptureAnalysisTool, 
  createChartCaptureAnalysisTool,
  changeTimeframeTool, 
  changeSymbolTool,
  changeInstrumentTypeTool,
  multiTimeframeAnalysisTool,
  entrySuggestionTool
};
