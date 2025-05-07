// src/mastra/tools/symbol-tools.ts
// 銘柄変更ツールの実装

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { socketService } from "../../../services/socketService";
import { logger } from "../../../utils/logger";

/**
 * チャートの銘柄を変更するツール
 * ソケット通信を使用してクライアント側の銘柄を変更します
 */
export const changeSymbolTool = createTool({
  id: "change-symbol",
  description: "チャートの銘柄を変更します。",
  inputSchema: z.object({
    symbol: z
      .string()
      .describe("変更する銘柄（例：BTCUSDT, ETHUSDT, SOLUSDT）"),
  }),
  outputSchema: z.object({
    success: z.boolean().describe("銘柄変更が成功したかどうか"),
    symbol: z.string().describe("変更後の銘柄"),
  }),
  execute: async ({ context }) => {
    try {
      const { symbol } = context;
      
      logger.info(`銘柄変更ツールが実行されました: ${symbol}`, {
        component: 'changeSymbolTool',
        action: 'execute',
        symbol
      });
      
      // socketServiceを使用して銘柄変更イベントを発行
      const success = await socketService.emitSymbolChange(symbol);
      
      if (success) {
        logger.info(`銘柄を${symbol}に変更しました`, {
          component: 'changeSymbolTool',
          action: 'execute'
        });
      } else {
        logger.warn(`銘柄${symbol}への変更に失敗しました`, {
          component: 'changeSymbolTool',
          action: 'execute'
        });
      }
      
      return {
        success,
        symbol
      };
    } catch (error) {
      logger.error('銘柄変更エラー:', error, {
        component: 'changeSymbolTool',
        action: 'execute',
        symbol: context.symbol
      });
      
      return {
        success: false,
        symbol: context.symbol
      };
    }
  },
});
