import { NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';
import { logger } from '@/utils/common';

// 型定義: global.emitSocketEvent exists in server.js
declare global {
  var emitSocketEvent: (
    eventName: string,
    data: any
  ) => Promise<{ success: boolean; error?: string; clientCount?: number }>;
}

/**
 * リクエストボディを検証
 *
 * @param request - Next.js Request オブジェクト
 * @param schema - Zod スキーマ
 * @param errorMessage - バリデーション失敗時のメッセージ
 * @returns 成功時はデータ、失敗時はNextResponse
 */
export async function validateRequest<T>(
  request: Request,
  schema: ZodSchema<T>,
  errorMessage = 'Invalid request'
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      logger.warn('Request validation failed', {
        component: 'api/chart/helpers',
        action: 'validateRequest',
        errors: result.error.format()
      });
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: errorMessage },
          { status: 400 }
        )
      };
    }
    return { success: true, data: result.data };
  } catch (error) {
    logger.error('Failed to parse request body', error, {
      component: 'api/chart/helpers',
      action: 'validateRequest'
    });
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      )
    };
  }
}

/**
 * Socketイベントを送信してレスポンスを構築
 *
 * @param eventName - 送信するイベント名
 * @param data - イベントデータ
 * @param successPayload - 成功時レスポンスに追加するデータ
 * @param failureMessage - 失敗時のメッセージ
 * @returns NextResponse
 */
export async function emitEventAndRespond(
  eventName: string,
  data: any,
  successPayload: Record<string, any>,
  failureMessage: string
): Promise<NextResponse> {
  const result = await global.emitSocketEvent(eventName, data);
  if (result.success) {
    logger.info(`イベント送信: ${eventName}`, {
      component: 'api/chart/helpers',
      action: 'emitEventAndRespond',
      clientCount: result.clientCount
    });
    return NextResponse.json({ success: true, ...successPayload });
  }
  logger.warn(`イベント送信失敗: ${eventName}`, {
    component: 'api/chart/helpers',
    action: 'emitEventAndRespond',
    error: result.error
  });
  return NextResponse.json(
    { success: false, error: result.error || failureMessage },
    { status: 500 }
  );
}
