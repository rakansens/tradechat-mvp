// src/mastra/tools/symbol-tools.ts
// 銘柄変更ツールの実装
// 更新: 2025-05-07 - Socket.IO直接使用からAPIエンドポイント使用に変更

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { logger } from "../../../utils/logger";
import fetch from "node-fetch";

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
    error: z.string().optional().describe("エラーメッセージ（失敗時のみ）"),
  }),
  execute: async ({ context }) => {
    try {
      const { symbol } = context;
      
      logger.info(`銘柄変更ツールが実行されました: ${symbol}`, {
        component: 'changeSymbolTool',
        action: 'execute',
        symbol
      });
      
      // APIエンドポイントを使用して銘柄変更リクエストを送信
      const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/chart/symbol`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol }),
      });
      
      const result = await response.json();
      const success = result.success === true;
      
      if (success) {
        logger.info(`銘柄を${symbol}に変更しました`, {
          component: 'changeSymbolTool',
          action: 'execute'
        });
      } else {
        logger.warn(`銘柄${symbol}への変更に失敗しました: ${result.error || '不明なエラー'}`, {
          component: 'changeSymbolTool',
          action: 'execute',
          error: result.error
        });
      }
      
      return {
        success,
        symbol,
        ...(result.error ? { error: result.error } : {})
      };
    } catch (error) {
      logger.error('銘柄変更エラー:', error, {
        component: 'changeSymbolTool',
        action: 'execute',
        symbol: context.symbol
      });
      
      const errorMessage = error instanceof Error ? error.message : '銘柄変更中に不明なエラーが発生しました';
      
      return {
        success: false,
        symbol: context.symbol,
        error: errorMessage
      };
    }
  },
});
