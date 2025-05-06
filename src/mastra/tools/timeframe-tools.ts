// src/mastra/tools/timeframe-tools.ts
// 時間足変更ツールの実装

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { socketService } from "../../../services/socketService";
import { logger } from "../../../utils/logger";

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
  }),
  execute: async ({ context }) => {
    try {
      const { timeframe } = context;
      
      logger.info(`時間足変更ツールが実行されました: ${timeframe}`, {
        component: 'changeTimeframeTool',
        action: 'execute',
        timeframe
      });
      
      // socketServiceを使用して時間足変更イベントを発行
      const success = await socketService.emitTimeframeChange(timeframe);
      
      if (success) {
        logger.info(`時間足を${timeframe}に変更しました`, {
          component: 'changeTimeframeTool',
          action: 'execute'
        });
      } else {
        logger.warn(`時間足${timeframe}への変更に失敗しました`, {
          component: 'changeTimeframeTool',
          action: 'execute'
        });
      }
      
      return {
        success,
        timeframe
      };
    } catch (error) {
      logger.error('時間足変更エラー:', error, {
        component: 'changeTimeframeTool',
        action: 'execute',
        timeframe: context.timeframe
      });
      
      return {
        success: false,
        timeframe: context.timeframe
      };
    }
  },
});
