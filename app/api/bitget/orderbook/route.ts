import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// API設定
const BITGET_API_BASE_URL = 'https://api.bitget.com';

// ---------------------------
// Supported symbol cache logic
// ---------------------------
type MarketType = 'spot' | 'futures';

// 30分キャッシュ
const CACHE_TTL = 30 * 60 * 1000;

// シンボルキャッシュ構造体
const SYMBOL_CACHE: Record<MarketType, { symbols: Set<string>; lastFetch: number }> = {
  spot: { symbols: new Set(), lastFetch: 0 },
  futures: { symbols: new Set(), lastFetch: 0 },
};

/**
 * 指定市場のサポート済みシンボルセットを取得 (キャッシュ付き)
 */
async function getSupportedSymbols(type: MarketType): Promise<Set<string>> {
  const now = Date.now();
  const cache = SYMBOL_CACHE[type];

  // キャッシュが有効ならそれを返す
  if (cache.symbols.size > 0 && now - cache.lastFetch < CACHE_TTL) {
    return cache.symbols;
  }

  // エンドポイントと追加paramsを選択
  let endpoint: string;
  let extraParams: Record<string, string> = {};
  if (type === 'spot') {
    endpoint = '/api/v2/spot/public/symbols';
  } else {
    endpoint = '/api/v2/mix/market/contracts';
    extraParams = { productType: 'USDT-FUTURES' };
  }

  try {
    const response = await axios.get(`${BITGET_API_BASE_URL}${endpoint}`, {
      timeout: 10000,
      headers: { Accept: 'application/json' },
      params: extraParams,
    });

    const list: any[] = Array.isArray(response.data?.data)
      ? response.data.data
      : Array.isArray(response.data)
      ? response.data
      : [];

    const newSet = new Set<string>();
    list.forEach((item) => {
      if (item?.symbol) {
        newSet.add(item.symbol.toUpperCase());
      }
    });

    // キャッシュへ保存
    cache.symbols = newSet;
    cache.lastFetch = now;

    return newSet;
  } catch (err) {
    console.error('Failed to fetch supported symbols:', err);
    // 取得失敗時はキャッシュに何も入れず空集合を返す
    return cache.symbols;
  }
}

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
    // -------------------------
    // サポートペアのバリデーション
    // -------------------------
    const supported = await getSupportedSymbols(type as MarketType);
    const symbolToCheck = symbol;
    // シンボルリスト取得に失敗した場合 (size===0) はバリデーションをスキップ
    if (supported.size > 0 && !supported.has(symbolToCheck.toUpperCase())) {
      return NextResponse.json(
        { error: `Unsupported symbol for ${type} market: ${symbol}` },
        { status: 400 }
      );
    }

    // リクエストパラメータの構築
    let endpoint: string;
    let params: Record<string, string> = {};

    if (type === 'spot') {
      // スポット市場はV2 APIを使用
      endpoint = '/api/v2/spot/market/orderbook';
      params = {
        symbol,
        limit,
      };
    } else {
      // 先物市場はV2 APIを使用
      endpoint = '/api/v2/mix/market/orderbook';
      params = {
        symbol,
        productType: 'USDT-FUTURES',
        limit: (parseInt(limit) > 100 ? '100' : limit),
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