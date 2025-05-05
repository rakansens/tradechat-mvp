// types/symbol.ts
// 作成: 銘柄情報の型定義

/**
 * 銘柄情報の型定義
 */
export interface SymbolInfo {
  /** 銘柄のシンボル (例: BTCUSDT) */
  symbol: string;
  /** 基礎通貨 (例: BTC) */
  baseAsset: string;
  /** 見積通貨 (例: USDT) */
  quoteAsset: string;
  /** 表示名 (例: BTC/USDT) */
  displayName: string;
  /** 価格の精度 (小数点以下の桁数) */
  pricePrecision: number;
  /** 数量の精度 (小数点以下の桁数) */
  quantityPrecision: number;
  /** 最小取引額 */
  minNotional?: string;
  /** 取引ステータス (例: TRADING, BREAK) */
  status: string;
  /** お気に入りフラグ */
  isFavorite?: boolean;
}

/**
 * 銘柄リストのフィルタリングオプション
 */
export interface SymbolFilterOptions {
  /** 検索キーワード */
  searchTerm: string;
  /** 見積通貨フィルター (例: USDT, BTC) */
  quoteAsset: string;
  /** お気に入りのみ表示 */
  favoritesOnly: boolean;
}