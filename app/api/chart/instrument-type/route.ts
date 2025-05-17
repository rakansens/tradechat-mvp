// app/api/chart/instrument-type/route.ts
// 取引タイプ（現物/先物）変更APIエンドポイント
// 更新: 2025-05-09 - エラーハンドリングを強化し、デバッグログを追加

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/utils/common';
import { validateRequest, emitEventAndRespond } from '../helpers';

// server.jsで定義されたグローバル関数の型定義

// リクエストボディのバリデーションスキーマ
const instrumentTypeSchema = z.object({
  type: z.enum(['spot', 'futures'], {
    invalid_type_error: '取引タイプは文字列である必要があります',
    required_error: '取引タイプは必須です',
  }),
  symbol: z.string().optional().describe('現在の銘柄'),
});

/**
 * 取引タイプ変更リクエストを処理するPOSTハンドラ
 * Mastraツールからのリクエストを受け取り、Socket.IOを使用してブラウザに通知
 */
export async function POST(request: Request) {
  try {
    // リクエストの詳細をログに記録
    logger.info(`取引タイプ変更APIリクエスト受信`, {
      component: 'api/chart/instrument-type',
      action: 'POST',
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers)
    });
    
    const validation = await validateRequest(request, instrumentTypeSchema, '無効な取引タイプです。"spot"または"futures"を指定してください');
    if (!validation.success) {
      return validation.response;
    }

    const { type, symbol } = validation.data;
    const fromType = type === 'spot' ? 'futures' : 'spot'; // 元の取引タイプを明示的に指定

    logger.info(`取引タイプ変更APIが呼び出されました: ${type} (from: ${fromType}, symbol: ${symbol || '指定なし'})`, {
      component: 'api/chart/instrument-type',
      action: 'POST',
      type,
      fromType,
      symbol
    });

    return await emitEventAndRespond(
      'instrument-type-change',
      { type, fromType, symbol },
      {
        message: `取引タイプを${type === 'spot' ? '現物' : '先物'}に変更しました`,
        type,
        fromType,
        symbol
      },
      '取引タイプ変更イベントの送信に失敗しました'
    );
  } catch (error) {
    logger.error('取引タイプ変更APIエラー:', error, {
      component: 'api/chart/instrument-type',
      action: 'POST'
    });
    return NextResponse.json(
      { success: false, error: '取引タイプ変更処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONSリクエストハンドラ - CORS対応
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
