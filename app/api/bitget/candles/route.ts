// Added server-side caching for candle data to reduce API calls to Bitget
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Bitget APIのベースURL
const BITGET_API_BASE_URL = 'https://api.bitget.com';

// デバッグモード
const DEBUG = true;

// キャッシュ設定
interface CandleCache {
  data: any;
  lastFetch: number;
}

// キャッシュTTL (30秒 - 開発中は短くして常に最新データを取得)
const CACHE_TTL = 30 * 1000;

// キャッシュストレージ
const CANDLE_CACHE: Record<string, CandleCache> = {};

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
    console.log('Candles API route called:', req.url);
    
    // URLからクエリパラメータを取得
    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'spot';
    const symbol = url.searchParams.get('symbol');
    const timeframe = url.searchParams.get('timeframe');
    const limit = url.searchParams.get('limit') || '100';
    const endTime = url.searchParams.get('endTime');
    
    console.log('Request params:', { type, symbol, timeframe, limit, endTime });

    // パラメータのバリデーション
    if (!symbol || !timeframe) {
      console.log('Error: Symbol and timeframe are required');
      return NextResponse.json({ error: 'Symbol and timeframe are required' }, { status: 400 });
    }
    
  // シンボルの正規化（BNBUSDTとBNB/USDTを同じように扱う）
  const normalizedSymbol = symbol.replace('/', '');
  console.log(`Normalized symbol: ${normalizedSymbol} (original: ${symbol})`);
  
  // デバッグ用：リクエストの詳細をログに出力
  console.log(`Candles API request details:
  - Symbol: ${symbol}
  - Normalized Symbol: ${normalizedSymbol}
  - Type: ${type}
  - Timeframe: ${timeframe}
  - Limit: ${limit}`);
    
    // キャッシュキーの生成
    const cacheKey = `${type}_${normalizedSymbol}_${timeframe}_${limit}_${endTime || 'latest'}`;
    const now = Date.now();
    
    // キャッシュチェック
    const cachedData = CANDLE_CACHE[cacheKey];
    if (cachedData && now - cachedData.lastFetch < CACHE_TTL) {
      // キャッシュが有効な場合はキャッシュデータを返す
      console.log(`Using cached candle data for ${symbol} (${timeframe})`); 
      return NextResponse.json(cachedData.data);
    }

    let endpoint: string;
    let params: Record<string, string> = {};

    // V2 APIを使用（2023年の最新API）
    if (type === 'spot') {
      // スポット取引用V2 API
      endpoint = '/api/v2/spot/market/candles';
      params = {
        symbol: normalizedSymbol,         // 正規化されたシンボルを使用
        granularity: convertTimeframeForBitgetV2(timeframe),
        limit,
        ...(endTime ? { endTime } : {})
      };
    } else {
      // 先物取引用V2 API
      endpoint = '/api/v2/mix/market/candles';
      // V2ではsymbolにサフィックスを付けず、productTypeで契約タイプを指定する
      const futuresSymbol = normalizedSymbol; // 正規化されたシンボルを使用
      const productType = 'umcbl'; // USDT無期限
      params = {
        symbol: futuresSymbol,
        productType,
        granularity: convertTimeframeForFuturesV2(timeframe),
        limit,
        ...(endTime ? { endTime } : {})
      };
    }

    const apiUrl = `${BITGET_API_BASE_URL}${endpoint}`;
    console.log('Calling Bitget API:', apiUrl, params);

    // スタブデータ（テスト用）- 時間順で昇順（古い順）にソートされていることを確認
    const currentTime = Date.now();
    const stubData = {
      code: '00000',
      msg: 'success',
      requestTime: currentTime,
      data: [
        // 時間が古い順（昇順）で並べる
        [currentTime - 86400000 * 4, 96200, 96300, 96000, 96250, 85.1],  // 4日前
        [currentTime - 86400000 * 3, 96250, 96400, 96100, 96300, 90.3],  // 3日前
        [currentTime - 86400000 * 2, 96300, 96450, 96200, 96350, 88.7],  // 2日前
        [currentTime - 86400000, 96400, 96500, 96300, 96400, 95.2],      // 1日前
        [currentTime, 96500, 96600, 96400, 96550, 100.5]                 // 最新
      ]
    };

    try {
      if (DEBUG) {
        console.log('Bitget API request details:');
        console.log('- URL:', apiUrl);
        console.log('- Params:', params);
      }
      
      // Bitget APIにリクエスト
      const response = await axios.get(apiUrl, { 
        params,
        timeout: 10000, // タイムアウトを増やす
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Bitget API response:', response.status, response.statusText);
      
      // レスポンスの一部をログに出力
      if (response.data && response.data.data) {
        console.log('Response data sample:', response.data.data.slice(0, 2));
      }
      
      // キャッシュに保存
      CANDLE_CACHE[cacheKey] = {
        data: response.data,
        lastFetch: now
      };
      
      // レスポンスをそのまま返す
      return NextResponse.json(response.data);
    } catch (axiosError: any) {
      // Axiosエラーの詳細をログに出力
      console.error('Bitget API request failed:');
      console.error('- URL:', apiUrl);
      console.error('- Params:', params);
      console.error('Axios error details:', {
        message: axiosError.message,
        code: axiosError.code,
        status: axiosError.response?.status,
        responseData: axiosError.response?.data,
        config: {
          url: axiosError.config?.url,
          params: axiosError.config?.params,
          method: axiosError.config?.method
        }
      });
      
      // 実際のAPIエラーを返す
      console.log('Returning actual API error');
      return NextResponse.json(
        { 
          error: 'Bitget API request failed', 
          details: {
            message: axiosError.message,
            status: axiosError.response?.status,
            data: axiosError.response?.data
          }
        }, 
        { status: axiosError.response?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error('Critical error in API route:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Bitget API V2用のタイムフレーム変換（スポット取引用）
 * V2 APIではkラインの時間範囲は文字列形式が必要
 */
function convertTimeframeForBitgetV2(timeframe: string): string {
  const mapping: Record<string, string> = {
    '1m': '1min',      // 1分足
    '5m': '5min',      // 5分足
    '15m': '15min',    // 15分足
    '30m': '30min',    // 30分足
    '1h': '1h',        // 1時間足
    '4h': '4h',        // 4時間足
    '6h': '6h',        // 6時間足
    '12h': '12h',      // 12時間足
    '1d': '1day',      // 日足
    '1w': '1week',     // 週足
    '1M': '1M',        // 月足
  };
  
  return mapping[timeframe] || '1day'; // デフォルトは日足
}

/**
 * Bitget API V2用のタイムフレーム変換（先物取引用）
 * V2 APIの先物取引ではタイムフレーム形式が異なる
 * 
 * 注意: Bitget APIの最新仕様に基づいて修正しました
 * 大文字ではなく小文字を使用します
 */
function convertTimeframeForFuturesV2(timeframe: string): string {
  const mapping: Record<string, string> = {
    '1m': '1m',        // 1分足
    '3m': '3m',        // 3分足（APIがサポート）
    '5m': '5m',        // 5分足
    '15m': '15m',      // 15分足
    '30m': '30m',      // 30分足
    '1h': '1H',        // 1時間足 ※大文字 "H"
    '4h': '4H',        // 4時間足 ※大文字 "H"
    '6h': '6H',        // 6時間足 ※大文字 "H"
    '12h': '12H',      // 12時間足 ※大文字 "H"
    '1d': '1D',        // 日足 ※大文字 "D"
    '3d': '3D',        // 3日足 (稀に使用)
    '1w': '1W',        // 週足 ※大文字 "W"
    '1M': '1M',        // 月足 （既に適切）
  };
  
  // デフォルトは1D
  return mapping[timeframe] || '1D';
}

/**
 * スポット取引用のタイムフレーム変換（V1 API用、非推奨）
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
 * 先物取引用のタイムフレーム変換（V1 API用、非推奨）
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
