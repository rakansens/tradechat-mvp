// src/mastra/tools/instrument-type-tools.ts
// 取引タイプ（現物/先物）変更ツールの実装
// 作成: 2025-05-08 - WebSocketベースの環境に対応

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { logger } from "../../../utils/logger";
import fetch from "node-fetch";

/**
 * チャートの取引タイプ（現物/先物）を変更するツール
 * APIエンドポイントを使用してクライアント側の取引タイプを変更します
 */
export const changeInstrumentTypeTool = createTool({
  id: "change-instrument-type",
  description: "現物取引と先物取引を切り替えます",
  inputSchema: z.object({
    type: z
      .enum(["spot", "futures"])
      .describe("変更する取引タイプ（'spot'=現物, 'futures'=先物）"),
  }),
  outputSchema: z.object({
    success: z.boolean().describe("取引タイプ変更が成功したかどうか"),
    message: z.string().describe("処理結果のメッセージ"),
    type: z.enum(["spot", "futures"]).describe("変更後の取引タイプ"),
    error: z.string().optional().describe("エラーメッセージ（失敗時のみ）")
  }),
  execute: async ({ context }) => {
    try {
      const { type } = context;
      
      logger.info(`取引タイプ変更ツールが実行されました: ${type}`, {
        component: 'changeInstrumentTypeTool',
        action: 'execute',
        type
      });
      
      // APIエンドポイントを使用して取引タイプ変更リクエストを送信
      const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/chart/instrument-type`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });
      
      const result = await response.json();
      const success = result.success === true;
      
      if (success) {
        logger.info(`取引タイプを${type === 'spot' ? '現物' : '先物'}に変更しました`, {
          component: 'changeInstrumentTypeTool',
          action: 'execute'
        });
      } else {
        logger.warn(`取引タイプ${type === 'spot' ? '現物' : '先物'}への変更に失敗しました: ${result.error || '不明なエラー'}`, {
          component: 'changeInstrumentTypeTool',
          action: 'execute',
          error: result.error
        });
      }
      
      return {
        success,
        message: success 
          ? `取引タイプを${type === 'spot' ? '現物' : '先物'}に変更しました` 
          : `取引タイプの変更に失敗しました${result.error ? ': ' + result.error : ''}`,
        type,
        ...(result.error ? { error: result.error } : {})
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '取引タイプ変更中に不明なエラーが発生しました';
      
      logger.error('取引タイプ変更エラー:', error, {
        component: 'changeInstrumentTypeTool',
        action: 'execute',
        type: context.type
      });
      
      return {
        success: false,
        message: `取引タイプの変更に失敗しました: ${errorMessage}`,
        type: context.type,
        error: errorMessage
      };
    }
  },
});
