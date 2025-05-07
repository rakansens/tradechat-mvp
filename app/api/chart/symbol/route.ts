// app/api/chart/symbol/route.ts
// 銘柄変更APIエンドポイント
// 作成: 2025-05-07 - Mastraツールからの銘柄変更リクエストを処理し、Socket.IOを使用してブラウザに通知
// 更新: 2025-05-07 - server.jsで定義されたグローバル関数を使用するように変更

import { NextResponse } from 'next/server';
import { logger } from '@/utils/logger';

// server.jsで定義されたグローバル関数の型定義
declare global {
  var emitSocketEvent: (eventName: string, data: any) => Promise<{ success: boolean; error?: string; clientCount?: number }>;
}

/**
 * 銘柄変更リクエストを処理するPOSTハンドラ
 * Mastraツールからのリクエストを受け取り、Socket.IOを使用してブラウザに通知
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { symbol } = body;

    if (!symbol) {
      logger.warn('銘柄変更リクエストに必要なパラメータがありません', {
        component: 'api/chart/symbol',
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

    // server.jsで定義されたグローバル関数を使用してイベントを送信
    const result = await global.emitSocketEvent('changeSymbol', { symbol });

    if (result.success) {
      logger.info(`銘柄変更イベントを送信しました: ${symbol}`, {
        component: 'api/chart/symbol',
        action: 'POST'
      });
      return NextResponse.json({ success: true, symbol });
    } else {
      logger.warn(`銘柄変更イベントの送信に失敗しました: ${symbol}`, {
        component: 'api/chart/symbol',
        action: 'POST',
        error: result.error
      });
      return NextResponse.json(
        { success: false, error: result.error || '銘柄変更イベントの送信に失敗しました' },
        { status: 500 }
      );
    }
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
