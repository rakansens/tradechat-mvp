// src/mastra/tools/instrument-type-tools.ts
// 取引タイプ（現物/先物）変更ツールの実装
// 更新: 2025-05-09 - エラーハンドリングを強化し、リトライ機能を追加

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { logger } from "../../../utils/common";
import fetch, { Response } from "node-fetch";
// 取引タイプを表す型（現物/先物）
type TradeType = 'spot' | 'futures';

// APIレスポンスの型定義
interface ApiResponse {
  success: boolean;
  error?: string;
  clientCount?: number;
}

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
    symbol: z
      .string()
      .optional()
      .describe("現在の銘柄を指定（省略時は現在の銘柄が使用されます）"),
  }),
  outputSchema: z.object({
    success: z.boolean().describe("取引タイプ変更が成功したかどうか"),
    message: z.string().describe("処理結果のメッセージ"),
    type: z.enum(["spot", "futures"]).describe("変更後の取引タイプ"),
    fromType: z.enum(["spot", "futures"]).optional().describe("変更前の取引タイプ"),
    error: z.string().optional().describe("エラーメッセージ（失敗時のみ）")
  }),
  execute: async ({ context }): Promise<{
    message: string;
    type: 'spot' | 'futures';
    success: boolean;
    fromType?: 'spot' | 'futures';
    error?: string;
  }> => {
    try {
      const { type, symbol } = context;
      // 元の取引タイプを明示的に指定（現在のタイプの反対）
      const fromType: TradeType = type === 'spot' ? 'futures' : 'spot';
      
      logger.info(`取引タイプ変更ツールが実行されました: ${type}${symbol ? `, 銘柄: ${symbol}` : ''}`, {
        component: 'changeInstrumentTypeTool',
        action: 'execute',
        data: { type, fromType, symbol }
      });
      
      // APIエンドポイントを使用して取引タイプ変更リクエストを送信
      const apiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      
      // リトライ用の設定
      const maxRetries = 3;
      let retryCount = 0;
      let response: Response | undefined;
      let responseText = '';
      
      while (retryCount < maxRetries) {
        try {
          // リクエストを送信
          response = await fetch(`${apiUrl}/api/chart/instrument-type`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ type, fromType, symbol }),
          });
          
          // レスポンスのテキストを取得
          responseText = await response.text();
          
          // レスポンスが正常な場合はループを抜ける
          if (response.ok) {
            break;
          }
          
          // エラーの場合はリトライ
          logger.warn(`取引タイプ変更APIリクエストが失敗しました (${response?.status}): ${responseText}`, {
            component: 'changeInstrumentTypeTool',
            action: 'execute',
            retryCount,
            status: response?.status,
            responseText
          });
          
          // リトライ回数をインクリメント
          retryCount++;
          
          // 少し待ってからリトライ
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
        } catch (fetchError) {
          // ネットワークエラーなどの場合
          logger.error(`取引タイプ変更APIリクエスト中にエラーが発生しました: ${fetchError}`, {
            component: 'changeInstrumentTypeTool',
            action: 'execute',
            retryCount,
            error: fetchError
          });
          
          // リトライ回数をインクリメント
          retryCount++;
          
          // 少し待ってからリトライ
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
        }
      }
      
      // 最大リトライ回数を超えた場合
      if (retryCount >= maxRetries && (!response || !response.ok)) {
        throw new Error(`APIリクエストが${maxRetries}回失敗しました: ${response ? response.status : 'レスポンスなし'}`);
      }
      
      // JSONをパース
      let result: ApiResponse;
      try {
        result = JSON.parse(responseText) as ApiResponse;
      } catch (parseError: unknown) {
        const errorMessage = parseError instanceof Error ? parseError.message : '不明なエラー';
        logger.error(`JSONパースエラー: ${responseText}`, {
          component: 'changeInstrumentTypeTool',
          action: 'execute',
          error: parseError
        });
        throw new Error(`レスポンスのJSONパースに失敗しました: ${errorMessage}`);
      }
      
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
        fromType,
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
        fromType: (context.type === 'spot' ? 'futures' : 'spot') as TradeType,
        error: errorMessage
      };
    }
  },
});
