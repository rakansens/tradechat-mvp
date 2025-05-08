// app/api/chart/instrument-type/route.ts
// 取引タイプ（現物/先物）変更APIエンドポイント
// 作成: 2025-05-08 - Mastraツールからの取引タイプ変更リクエストを処理し、Socket.IOを使用してブラウザに通知

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/utils/logger';

// server.jsで定義されたグローバル関数の型定義
declare global {
  var emitSocketEvent: (eventName: string, data: any) => Promise<{ success: boolean; error?: string; clientCount?: number }>;
}

// リクエストボディのバリデーションスキーマ
const instrumentTypeSchema = z.object({
  type: z.enum(['spot', 'futures'], {
    invalid_type_error: '取引タイプは文字列である必要があります',
    required_error: '取引タイプは必須です',
  }),
});

/**
 * 取引タイプ変更リクエストを処理するPOSTハンドラ
 * Mastraツールからのリクエストを受け取り、Socket.IOを使用してブラウザに通知
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // バリデーション
    const result = instrumentTypeSchema.safeParse(body);
    if (!result.success) {
      logger.warn('取引タイプ変更リクエストのバリデーションエラー', {
        component: 'api/chart/instrument-type',
        action: 'POST',
        errors: result.error.format()
      });
      return NextResponse.json(
        { 
          success: false, 
          error: '無効な取引タイプです。"spot"または"futures"を指定してください' 
        },
        { status: 400 }
      );
    }
    
    const { type } = result.data;

    logger.info(`取引タイプ変更APIが呼び出されました: ${type}`, {
      component: 'api/chart/instrument-type',
      action: 'POST',
      type
    });

    // server.jsで定義されたグローバル関数を使用してイベントを送信
    const socketResult = await global.emitSocketEvent('instrument-type-change', { type });

    if (socketResult.success) {
      logger.info(`取引タイプ変更イベントを送信しました: ${type}`, {
        component: 'api/chart/instrument-type',
        action: 'POST',
        clientCount: socketResult.clientCount
      });
      return NextResponse.json({ 
        success: true, 
        message: `取引タイプを${type === 'spot' ? '現物' : '先物'}に変更しました`,
        type 
      });
    } else {
      logger.warn(`取引タイプ変更イベントの送信に失敗しました: ${type}`, {
        component: 'api/chart/instrument-type',
        action: 'POST',
        error: socketResult.error
      });
      return NextResponse.json(
        { 
          success: false, 
          error: socketResult.error || '取引タイプ変更イベントの送信に失敗しました' 
        },
        { status: 500 }
      );
    }
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
