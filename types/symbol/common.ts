/**
 * シンボル関連の共通型定義
 * 
 * このファイルはアプリケーション全体で使用されるシンボル関連の型を定義します。
 */

import { ExchangeType, ExchangeProductType } from '../constants/enums';

/**
 * シンボルの変更可能な値の型
 * シンボルの変更履歴で使用される値の型を定義します
 */
export type SymbolChangeValue = 
  | string 
  | number 
  | boolean 
  | ExchangeType 
  | ExchangeProductType
  | null 
  | undefined;

/**
 * 共通の銘柄情報インターフェース
 * アプリケーション全体で使用される基本的な銘柄情報を定義します
 */
export interface SymbolInfo {
  id: string;            // 一意のID
  symbol: string;        // 銘柄シンボル（例: "BTC/USDT"）
  baseCoin: string;      // 基軸通貨（例: "BTC"）
  quoteCoin: string;     // 取引通貨（例: "USDT"）
  minOrderSize: number;  // 最小注文量
  pricePrecision: number; // 価格精度
  quantityPrecision: number; // 数量精度
  status: string;        // 取引状態（'online'、'offline'など）
  exchangeType: ExchangeProductType; // 取引タイプ（'spot' または 'futures'）
  favorite: boolean;     // お気に入り状態
}

/**
 * 銘柄詳細情報
 * 基本的なSymbolInfoに加えて、追加情報を含む
 */
export interface SymbolDetail extends SymbolInfo {
  priceChangePercent: number;  // 価格変動率（%）
  highPrice: number;          // 24時間の最高価格
  lowPrice: number;           // 24時間の最低価格
  volume: number;             // 24時間の取引量（baseCoin）
  quoteVolume: number;        // 24時間の取引量（quoteCoin）
  lastPrice: number;          // 最新価格
  openPrice: number;          // 24時間前の始値
}

/**
 * シンボル変更履歴エントリー
 * デバッグと監視目的で使用
 */
export interface SymbolChangeHistoryEntry {
  id: string;                        // 変更履歴の一意識別子
  timestamp: number;                 // 変更が発生したタイムスタンプ
  symbol: string;                    // 影響を受けたシンボル
  exchangeType: ExchangeProductType;  // 取引タイプ
  field: string;                     // 変更されたフィールド名
  oldValue: SymbolChangeValue;       // 変更前の値
  newValue: SymbolChangeValue;       // 変更後の値
  source: string;                    // 変更の発生源（例: 'user', 'system', 'api'）
  from?: string;                     // 変更元（オプション）
  to?: string;                       // 変更先（オプション）
  reason?: string;                   // 変更理由（オプション）
}

/**
 * フィルタリングオプション
 * SymbolInfo配列のフィルタリングに使用
 */
export interface SymbolFilterOptions {
  search?: string;                   // 検索クエリ（シンボル名で部分一致）
  exchangeType?: ExchangeProductType; // 取引タイプ（'spot' または 'futures'）でフィルタリング
  favorite?: boolean;                // お気に入りのみを表示
  stable?: boolean;                  // 安定コインペアのみを表示
  sort?: 'name' | 'price' | 'change' | 'volume'; // ソート基準
  direction?: 'asc' | 'desc';        // ソート方向
  
  // レガシーサポートのための追加プロパティ
  searchTerm?: string;               // searchのエイリアス
  quoteCoin?: string;                // クォート通貨でフィルタリング
  favoritesOnly?: boolean;           // favoriteのエイリアス
  hideStablePairs?: boolean;         // stableの反対の意味
}
