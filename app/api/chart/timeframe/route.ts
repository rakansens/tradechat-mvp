// app/api/chart/timeframe/route.ts
// 時間足変更APIエンドポイント
// 作成: 2025-05-07 - Mastraツールからの時間足変更リクエストを処理し、Socket.IOを使用してブラウザに通知
// 更新: 2025-05-07 - server.jsで定義されたグローバル関数を使用するように変更

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/utils/common';
import { TIMEFRAMES } from '@/types/constants/enums';
import { validateRequest, emitEventAndRespond } from '../helpers';

// server.jsで定義されたグローバル関数の型定義
const timeframeSchema = z.object({
  timeframe: z.enum(TIMEFRAMES, { required_error: '時間足パラメータが必要です' })
});

/**
 * 時間足変更リクエストを処理するPOSTハンドラ
 * Mastraツールからのリクエストを受け取り、Socket.IOを使用してブラウザに通知
 */
export async function POST(request: Request) {
  try {
    const validation = await validateRequest(request, timeframeSchema, '時間足パラメータが必要です');
    if (!validation.success) {
      return validation.response;
    }
    const { timeframe } = validation.data;

    logger.info(`時間足変更APIが呼び出されました: ${timeframe}`, {
      component: 'api/chart/timeframe',
      action: 'POST',
      timeframe
    });

    return await emitEventAndRespond(
      'changeTimeframe',
      { timeframe },
      { timeframe },
      '時間足変更イベントの送信に失敗しました'
    );
  } catch (error) {
    logger.error('時間足変更APIエラー:', error, {
      component: 'api/chart/timeframe',
      action: 'POST'
    });
    return NextResponse.json(
      { success: false, error: '時間足変更処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
