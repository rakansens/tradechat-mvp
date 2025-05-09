// src/mastra/tools/symbol-tools.ts
// 銘柄変更ツールの実装
// 更新: 2025-05-07 - Socket.IO直接使用からAPIエンドポイント使用に変更
// 更新: 2025-05-09 - クライアントサイドでの動作を改善、デバッグログを追加
// 更新: 2025-05-09 - クライアントサイドとサーバーサイドの実行を明確に分離
// 更新: 2025-05-09 - Socket.IOを経由した実装に戻す

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { logger } from "../../../utils/logger";
import fetch from "node-fetch";
import { ExchangeType } from "../../../types/api";

/**
 * チャートの銘柄を変更するツール
 * Socket.IOを使用してクライアント側の銘柄を変更します
 */
export const changeSymbolTool = createTool({
  id: "change-symbol",
  description: "チャートの銘柄を変更します。",
  inputSchema: z.object({
    symbol: z
      .string()
      .describe("変更する銘柄（例：BTCUSDT, ETHUSDT, SOLUSDT）"),
    exchangeType: z
      .enum(['spot', 'futures'])
      .optional()
      .describe("取引タイプ（現物または先物）。指定がない場合は現在の取引タイプを使用"),
  }),
  outputSchema: z.object({
    success: z.boolean().describe("銘柄変更が成功したかどうか"),
    symbol: z.string().describe("変更後の銘柄"),
    error: z.string().optional().describe("エラーメッセージ（失敗時のみ）"),
  }),
  execute: async ({ context }) => {
    try {
      const { symbol, exchangeType } = context;
      
      logger.info(`銘柄変更ツールが実行されました: ${symbol}${exchangeType ? `, 取引タイプ: ${exchangeType}` : ''}`, {
        component: 'changeSymbolTool',
        action: 'execute',
        data: { symbol, exchangeType }
      });
      
      // APIエンドポイントを使用して銘柄変更リクエストを送信
      const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/chart/symbol`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol, exchangeType }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`銘柄変更APIエラー: ${response.status} ${response.statusText}`, {
          component: 'changeSymbolTool',
          action: 'execute',
          error: errorText,
          symbol
        });
        throw new Error(`銘柄変更に失敗しました: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      logger.info(`銘柄変更APIレスポンス: ${JSON.stringify(result)}`, {
        component: 'changeSymbolTool',
        action: 'execute',
        response: result,
        symbol
      });
      
      logger.info(`銘柄を${symbol}に変更しました`, {
        component: 'changeSymbolTool',
        action: 'execute',
        success: true,
        symbol
      });
      
      return {
        success: true,
        symbol
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
