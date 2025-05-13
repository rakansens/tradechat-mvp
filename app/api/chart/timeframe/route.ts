// app/api/chart/timeframe/route.ts
// 時間足変更APIエンドポイント
// 作成: 2025-05-07 - Mastraツールからの時間足変更リクエストを処理し、Socket.IOを使用してブラウザに通知
// 更新: 2025-05-07 - server.jsで定義されたグローバル関数を使用するように変更

import { NextResponse } from 'next/server';
import { logger } from '@/utils/common';

// server.jsで定義されたグローバル関数の型定義
declare global {
  var emitSocketEvent: (eventName: string, data: any) => Promise<{ success: boolean; error?: string; clientCount?: number }>;
}

/**
 * 時間足変更リクエストを処理するPOSTハンドラ
 * Mastraツールからのリクエストを受け取り、Socket.IOを使用してブラウザに通知
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { timeframe } = body;

    if (!timeframe) {
      logger.warn('時間足変更リクエストに必要なパラメータがありません', {
        component: 'api/chart/timeframe',
        action: 'POST'
      });
      return NextResponse.json(
        { success: false, error: '時間足パラメータが必要です' },
        { status: 400 }
      );
    }

    logger.info(`時間足変更APIが呼び出されました: ${timeframe}`, {
      component: 'api/chart/timeframe',
      action: 'POST',
      timeframe
    });

    // server.jsで定義されたグローバル関数を使用してイベントを送信
    const result = await global.emitSocketEvent('changeTimeframe', { timeframe });

    if (result.success) {
      logger.info(`時間足変更イベントを送信しました: ${timeframe}`, {
        component: 'api/chart/timeframe',
        action: 'POST'
      });
      return NextResponse.json({ success: true, timeframe });
    } else {
      logger.warn(`時間足変更イベントの送信に失敗しました: ${timeframe}`, {
        component: 'api/chart/timeframe',
        action: 'POST',
        error: result.error
      });
      return NextResponse.json(
        { success: false, error: result.error || '時間足変更イベントの送信に失敗しました' },
        { status: 500 }
      );
    }
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
