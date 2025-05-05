import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// API設定
const BITGET_API_BASE_URL = 'https://api.bitget.com';

/**
 * Bitgetからオーダーブック（板情報）を取得するためのAPIプロキシエンドポイント
 * クエリパラメータ:
 * - symbol: 取引ペアシンボル(例: BTCUSDT)
 * - type: 'spot' または 'futures'
 * - limit: (オプション) オーダーブックの深さ (デフォルト: 150)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const type = searchParams.get('type') || 'spot';
  const limit = searchParams.get('limit') || '150';

  // バリデーション
  if (!symbol) {
    return NextResponse.json(
      { error: 'Symbol parameter is required' },
      { status: 400 }
    );
  }

  if (type !== 'spot' && type !== 'futures') {
    return NextResponse.json(
      { error: 'Type must be either spot or futures' },
      { status: 400 }
    );
  }

  try {
    // リクエストパラメータの構築
    let endpoint: string;
    let params: Record<string, string> = {};

    if (type === 'spot') {
      endpoint = '/api/v2/spot/market/orderbook';
      params = {
        symbol,
        limit,
      };
    } else {
      endpoint = '/api/v2/mix/market/orderbook';
      params = {
        symbol: `${symbol}_UMCBL`,
        limit,
      };
    }

    // Bitget APIへリクエスト送信
    const response = await axios.get(`${BITGET_API_BASE_URL}${endpoint}`, {
      params,
    });

    // レスポンスをそのまま返す
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching order book from Bitget:', error);
    
    // エラー応答の構築
    const status = error.response?.status || 500;
    const errorMessage = error.response?.data?.msg || error.message || 'Unknown error';
    
    return NextResponse.json(
      { error: errorMessage },
      { status }
    );
  }
} 