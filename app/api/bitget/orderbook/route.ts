// Added server-side caching for order book data to reduce API calls to Bitget
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// API設定
const BITGET_API_BASE_URL = 'https://api.bitget.com';

// ---------------------------
// Supported symbol cache logic
// ---------------------------
type MarketType = 'spot' | 'futures';

// 30分キャッシュ (シンボル一覧用)
const SYMBOL_CACHE_TTL = 30 * 60 * 1000;

// オーダーブックキャッシュ (5秒)
const ORDERBOOK_CACHE_TTL = 5 * 1000;

// シンボルキャッシュ構造体
const SYMBOL_CACHE: Record<MarketType, { symbols: Set<string>; lastFetch: number }> = {
  spot: { symbols: new Set(), lastFetch: 0 },
  futures: { symbols: new Set(), lastFetch: 0 },
};

// オーダーブックキャッシュ構造体
interface OrderBookCache {
  data: any;
  lastFetch: number;
}

const ORDERBOOK_CACHE: Record<string, OrderBookCache> = {};

/**
 * 指定市場のサポート済みシンボルセットを取得 (キャッシュ付き)
 */
async function getSupportedSymbols(type: MarketType): Promise<Set<string>> {
  const now = Date.now();
  const cache = SYMBOL_CACHE[type];

  // キャッシュが有効ならそれを返す
  if (cache.symbols.size > 0 && now - cache.lastFetch < SYMBOL_CACHE_TTL) {
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
    // デバッグ情報を出力
    console.log(`Request for orderbook: symbol=${symbol}, type=${type}`);
    
    // シンボルの正規化（BNBUSDTとBNB/USDTを同じように扱う）
    const normalizedSymbol = symbol.replace('/', '');
    console.log(`Normalized symbol: ${normalizedSymbol} (original: ${symbol})`);
    
    // デバッグ用：リクエストの詳細をログに出力
    console.log(`OrderBook API request details:
    - Symbol: ${symbol}
    - Normalized Symbol: ${normalizedSymbol}
    - Type: ${type}
    - Limit: ${limit}`);
    
    // -------------------------
    // サポートペアのバリデーション
    // -------------------------
    const supported = await getSupportedSymbols(type as MarketType);
    // 正規化したシンボルでチェック
    const symbolToCheck = normalizedSymbol;
    // シンボルリスト取得に失敗した場合 (size===0) はバリデーションをスキップ
    if (supported.size > 0 && !supported.has(symbolToCheck.toUpperCase())) {
      return NextResponse.json(
        { error: `Unsupported symbol for ${type} market: ${symbol} (normalized: ${normalizedSymbol})` },
        { status: 400 }
      );
    }
    
    // キャッシュキーの生成
    const cacheKey = `${type}_${normalizedSymbol}_${limit}`;
    const now = Date.now();
    
    // キャッシュチェック
    const cachedData = ORDERBOOK_CACHE[cacheKey];
    if (cachedData && now - cachedData.lastFetch < ORDERBOOK_CACHE_TTL) {
      // キャッシュが有効な場合はキャッシュデータを返す
      console.log(`Using cached orderbook data for ${normalizedSymbol} (${type})`); 
      return NextResponse.json(cachedData.data);
    }

    // リクエストパラメータの構築
    let endpoint: string;
    let params: Record<string, string> = {};

    if (type === 'spot') {
      // スポット市場はV2 APIを使用
      endpoint = '/api/v2/spot/market/orderbook';
      params = {
        symbol: normalizedSymbol,
        limit,
      };
    } else {
      // 先物市場はV2 APIを使用
      endpoint = '/api/v2/mix/market/orderbook';
      params = {
        symbol: normalizedSymbol,
        productType: 'USDT-FUTURES',
        limit: (parseInt(limit) > 100 ? '100' : limit),
      };
    }
    
    console.log(`API endpoint: ${BITGET_API_BASE_URL}${endpoint}`);
    console.log(`API params: ${JSON.stringify(params)}`);

    console.log(`Fetching fresh orderbook data for ${normalizedSymbol} (${type})`);
    // Bitget APIへリクエスト送信
    const response = await axios.get(`${BITGET_API_BASE_URL}${endpoint}`, {
      params,
    });
    
    // キャッシュに保存
    ORDERBOOK_CACHE[cacheKey] = {
      data: response.data,
      lastFetch: now
    };

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
