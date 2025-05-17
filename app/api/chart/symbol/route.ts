// app/api/chart/symbol/route.ts
// 銘柄変更APIエンドポイント
// 作成: 2025-05-07 - Mastraツールからの銘柄変更リクエストを処理し、Socket.IOを使用してブラウザに通知
// 更新: 2025-05-07 - server.jsで定義されたグローバル関数を使用するように変更

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/utils/common';
import { ExchangeType, EXCHANGE_TYPES } from '@/types/constants/enums';
import { validateRequest, emitEventAndRespond } from '../helpers';

const symbolSchema = z.object({
  symbol: z.string({ required_error: '銘柄パラメータが必要です' }),
  exchangeType: z.enum(EXCHANGE_TYPES).optional()
});

// server.jsで定義されたグローバル関数の型定義

/**
 * 銘柄変更リクエストを処理するPOSTハンドラ
 * Mastraツールからのリクエストを受け取り、Socket.IOを使用してブラウザに通知
 */
export async function POST(request: Request) {
  try {
    const validation = await validateRequest(request, symbolSchema, '銘柄パラメータが必要です');
    if (!validation.success) {
      return validation.response;
    }

    let { symbol, exchangeType } = validation.data;
    
    // 銘柄名の形式をチェックして必要に応じて変換
    if (!symbol.includes('/') && !symbol.includes('USDT') && !symbol.includes('usdt')) {
      // 単一の銘柄名の場合は自動的にUSDTを付加
      const originalSymbol = symbol;
      symbol = `${symbol}USDT`;
      
      logger.info(`銘柄名を変換しました: ${originalSymbol} -> ${symbol}`, {
        component: 'api/chart/symbol',
        action: 'POST',
        originalSymbol,
        convertedSymbol: symbol
      });
    }

    logger.info(`銘柄変更APIが呼び出されました: ${symbol}`, {
      component: 'api/chart/symbol',
      action: 'POST',
      symbol
    });

    return await emitEventAndRespond(
      'changeSymbol',
      { symbol, exchangeType },
      { symbol },
      '銘柄変更イベントの送信に失敗しました'
    );
  } catch (error) {
    logger.error('銘柄変更APIエラー:', error, {
      component: 'api/chart/symbol',
      action: 'POST'
    });
    return NextResponse.json(
      { success: false, error: '銘柄変更処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
