import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BITGET_API_BASE_URL = 'https://api.bitget.com';

/**
 * Bitget API プロキシエンドポイント
 * 
 * このAPIルートは、フロントエンドからのリクエストをBitget APIに中継し、
 * CORSエラーを回避するために使用されます。
 * 
 * クエリパラメータ:
 * - type: 取引タイプ（'spot' または 'futures'）
 * - symbol: 取引ペア（例: 'BTCUSDT'）
 * - timeframe: タイムフレーム（例: '1m', '1h'）
 * - limit: 取得する足の数
 */
export async function GET(req: NextRequest) {
  try {
    // URLからクエリパラメータを取得
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'spot';
    const symbol = url.searchParams.get('symbol');
    const timeframe = url.searchParams.get('timeframe');
    const limit = url.searchParams.get('limit') || '100';
    const endTime = url.searchParams.get('endTime');

    // パラメータのバリデーション
    if (!symbol || !timeframe) {
      return NextResponse.json({ error: 'Symbol and timeframe are required' }, { status: 400 });
    }

    let endpoint: string;
    let params: Record<string, string> = {};

    // 取引タイプに応じてエンドポイントとパラメータを設定
    if (type === 'spot') {
      endpoint = '/api/spot/v1/market/candles';
      params = {
        symbol,
        period: convertTimeframeForSpot(timeframe),
        limit,
        ...(endTime ? { endTime } : {}),
      };
    } else {
      endpoint = '/api/mix/v1/market/candles';
      // 先物取引の場合、シンボルに_UMCBLを追加（BitgetのAPI仕様）
      const futuresSymbol = symbol.endsWith('_UMCBL') ? symbol : `${symbol}_UMCBL`;
      params = {
        symbol: futuresSymbol,
        granularity: convertTimeframeForFutures(timeframe),
        limit,
        ...(endTime ? { endTime } : {}),
      };
    }

    // Bitget APIにリクエスト
    const response = await axios.get(`${BITGET_API_BASE_URL}${endpoint}`, { params });
    
    // レスポンスをそのまま返す
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Bitget API Proxy Error:', error);
    
    // エラーレスポンスを適切に処理
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { error: error.response.data || 'API request failed' },
        { status: error.response.status || 500 }
      );
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * スポット取引用のタイムフレーム変換
 */
function convertTimeframeForSpot(timeframe: string): string {
  const mapping: Record<string, string> = {
    '1m': '1min',
    '5m': '5min',
    '15m': '15min',
    '30m': '30min',
    '1h': '1h',
    '4h': '4h',
    '1d': '1day',
    '1w': '1week',
  };
  
  return mapping[timeframe] || '1min';
}

/**
 * 先物取引用のタイムフレーム変換
 */
function convertTimeframeForFutures(timeframe: string): string {
  const mapping: Record<string, string> = {
    '1m': '1m',
    '5m': '5m',
    '15m': '15m',
    '30m': '30m',
    '1h': '1H',
    '4h': '4H',
    '1d': '1D',
    '1w': '1W',
  };
  
  return mapping[timeframe] || '1m';
} 