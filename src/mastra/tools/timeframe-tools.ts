// src/mastra/tools/timeframe-tools.ts
// 時間足変更ツールの実装
// 更新: 2025-05-07 - Socket.IO直接使用からAPIエンドポイント使用に変更

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { logger } from "@/utils/common";
import fetch from "node-fetch";

/**
 * チャートの時間足を変更するツール
 * ソケット通信を使用してクライアント側の時間足を変更します
 */
export const changeTimeframeTool = createTool({
  id: "change-timeframe",
  description: "チャートの時間足を変更します。",
  inputSchema: z.object({
    timeframe: z
      .string()
      .describe("変更する時間足（例：1m, 5m, 15m, 1h, 4h, 1d）"),
  }),
  outputSchema: z.object({
    success: z.boolean().describe("時間足変更が成功したかどうか"),
    timeframe: z.string().describe("変更後の時間足"),
    error: z.string().optional().describe("エラーメッセージ（失敗時のみ）")
  }),
  execute: async ({ context }) => {
    try {
      const { timeframe } = context;
      
      logger.info(`時間足変更ツールが実行されました: ${timeframe}`, {
        component: 'changeTimeframeTool',
        action: 'execute',
        timeframe
      });
      
      // APIエンドポイントを使用して時間足変更リクエストを送信
      const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/chart/timeframe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timeframe }),
      });
      
      const result = await response.json();
      const success = result.success === true;
      
      if (success) {
        logger.info(`時間足を${timeframe}に変更しました`, {
          component: 'changeTimeframeTool',
          action: 'execute'
        });
      } else {
        logger.warn(`時間足${timeframe}への変更に失敗しました: ${result.error || '不明なエラー'}`, {
          component: 'changeTimeframeTool',
          action: 'execute',
          error: result.error
        });
      }
      
      return {
        success,
        timeframe,
        ...(result.error ? { error: result.error } : {})
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '時間足変更中に不明なエラーが発生しました';
      
      logger.error('時間足変更エラー:', error, {
        component: 'changeTimeframeTool',
        action: 'execute',
        timeframe: context.timeframe
      });
      
      return {
        success: false,
        timeframe: context.timeframe,
        error: errorMessage
      };
    }
  },
});
