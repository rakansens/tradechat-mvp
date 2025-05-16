/**
 * シンボル（銘柄）関連の型定義
 * 
 * このファイルはシンボル関連の型定義を集約し、
 * アプリケーション全体でのシンボル情報の一貫性を保証します。
 * 各コンポーネントやサービスはこのファイルから型をインポートします。
 */

import { ExchangeType } from '@/types/network/api';
import { StoreFilterOptions } from '@/types/store';

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
  exchangeType: ExchangeType; // 取引所タイプ
  favorite: boolean;     // お気に入り状態
}

/**
 * シンボル変更履歴の型定義
 * シンボル変更を記録するために使用されます
 */
export interface SymbolChangeHistory {
  from: string;          // 変更前のシンボル
  to: string;            // 変更後のシンボル
  timestamp: number;     // 変更タイムスタンプ
  reason?: string;       // 変更理由（オプション）
}

/**
 * 銘柄フィルタリングオプション
 * UI層でのフィルター操作に使用されます
 */
export interface FilterOptions extends StoreFilterOptions {
  // StoreFilterOptionsに既に定義されているプロパティを使用
  // searchTerm: string
  // quoteAsset: string
  // favoritesOnly: boolean
} 