/**
 * types/constants/precision.ts
 * 作成: T-7.5フェーズ - 数値精度の定義
 * 
 * このファイルでは、アプリケーション全体で使用される数値精度の定義を管理します。
 * 通貨ペアや数値タイプに応じた適切な精度を定義することで、表示の一貫性と
 * 計算精度の適切な管理を実現します。
 * 
 * 注意: decimal.jsのような高精度数値演算は現段階では使用せず、
 * 文字列として保持 + number型演算 + 桁数固定の組み合わせで対応します。
 */

// 一般的な精度定義
export const DEFAULT_PRECISION = {
  // 価格表示
  PRICE: 8,          // 暗号資産価格（最大8桁）
  AMOUNT: 6,         // 数量（最大6桁）
  TOTAL: 4,          // 合計（最大4桁）
  PERCENTAGE: 2,     // パーセント表示（2桁）
  FIAT: 2,           // 法定通貨（2桁）
  FEE: 4,            // 手数料（4桁）
  
  // UI表示用
  COMPACT: 1,        // 省略表示（例: 1.2k, 3.5M）
  ORDERBOOK: 8,      // オーダーブック価格
  TRADE_HISTORY: 8,  // 取引履歴
  
  // 計算用
  INTERNAL: 10       // 内部計算用（表示前の計算精度）
};

// 主要暗号資産のTicker別精度定義
export const TICKER_PRECISION: Record<string, number> = {
  // メジャー暗号資産
  'BTC': 8,
  'ETH': 6,
  'BNB': 6,
  'XRP': 4,
  'ADA': 6,
  'SOL': 4,
  'DOT': 4,
  
  // ステーブルコイン（法定通貨と同じ精度）
  'USDT': 2,
  'USDC': 2,
  'DAI': 2,
  'BUSD': 2,
  
  // その他の主要アルトコイン
  'DOGE': 8,
  'SHIB': 10,       // 特に小さい単価のコイン
  
  // デフォルト値
  'DEFAULT': 8
};

// 通貨ペア別の精度定義
export const PAIR_PRECISION: Record<string, { price: number, amount: number }> = {
  'BTC/USDT': { price: 2, amount: 6 },
  'ETH/USDT': { price: 2, amount: 5 },
  'BNB/USDT': { price: 2, amount: 4 },
  'SOL/USDT': { price: 3, amount: 2 },
  'XRP/USDT': { price: 4, amount: 1 },
  
  // アルトコインペア
  'ETH/BTC': { price: 6, amount: 4 },
  'SOL/BTC': { price: 8, amount: 2 },
  
  // デフォルト値
  'DEFAULT': { price: 8, amount: 4 }
};

/**
 * 通貨ペアに基づいて適切な価格精度を取得
 * @param pair 通貨ペア（例: "BTC/USDT"）
 * @returns 価格精度（小数点以下の桁数）
 */
export function getPricePrecision(pair: string): number {
  return PAIR_PRECISION[pair]?.price || PAIR_PRECISION.DEFAULT.price;
}

/**
 * 通貨ペアに基づいて適切な数量精度を取得
 * @param pair 通貨ペア（例: "BTC/USDT"）
 * @returns 数量精度（小数点以下の桁数）
 */
export function getAmountPrecision(pair: string): number {
  return PAIR_PRECISION[pair]?.amount || PAIR_PRECISION.DEFAULT.amount;
}

/**
 * 通貨シンボルに基づいて適切な精度を取得
 * @param ticker 通貨シンボル（例: "BTC"）
 * @returns 精度（小数点以下の桁数）
 */
export function getTickerPrecision(ticker: string): number {
  return TICKER_PRECISION[ticker] || TICKER_PRECISION.DEFAULT;
} 