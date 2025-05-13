// app/api/chart/symbol/log/route.ts
// 銘柄変更ログ用APIエンドポイント
// 作成: 2025-05-09 - Mastraツールからの銘柄変更を直接UIに反映するための簡易化されたフロー用

import { NextResponse } from 'next/server';
import { logger } from '@/utils/common';

/**
 * 銘柄変更のログを記録するだけのPOSTハンドラ
 * Mastraツールからのリクエストを受け取り、ログに記録するだけで、Socket.IOイベントは発行しない
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { symbol } = body;

    if (!symbol) {
      logger.warn('銘柄変更ログリクエストに必要なパラメータがありません', {
        component: 'api/chart/symbol/log',
        action: 'POST'
      });
      return NextResponse.json(
        { success: false, error: '銘柄パラメータが必要です' },
        { status: 400 }
      );
    }
    
    // 銘柄名の形式をチェックして必要に応じて変換
    if (!symbol.includes('/') && !symbol.includes('USDT') && !symbol.includes('usdt')) {
      // 単一の銘柄名の場合は自動的にUSDTを付加
      const originalSymbol = symbol;
      symbol = `${symbol}USDT`;
      
      logger.info(`銘柄名を変換しました: ${originalSymbol} -> ${symbol}`, {
        component: 'api/chart/symbol/log',
        action: 'POST',
        originalSymbol,
        convertedSymbol: symbol
      });
    }

    logger.info(`銘柄変更ログAPIが呼び出されました: ${symbol}`, {
      component: 'api/chart/symbol/log',
      action: 'POST',
      symbol,
      timestamp: new Date().toISOString(),
      source: 'direct-ui-update'
    });

    // ログを記録するだけで、Socket.IOイベントは発行しない
    return NextResponse.json({ 
      success: true, 
      symbol,
      message: `銘柄変更がログに記録されました: ${symbol}`
    });
  } catch (error) {
    logger.error('銘柄変更ログAPIエラー:', error, {
      component: 'api/chart/symbol/log',
      action: 'POST'
    });
    return NextResponse.json(
      { success: false, error: '銘柄変更ログ処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
