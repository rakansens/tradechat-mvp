/**
 * シンボル（銘柄）関連の共通型定義
 * 
 * このファイルはシンボル（銘柄）関連の型定義を集約し、
 * market.ts、symbol.ts、store/app.tsなどでの重複を解消するために作成されました。
 */

import { ExchangeType } from '../network/api';

/**
 * 共通の銘柄情報インターフェース
 */
export interface SymbolInfo {
  symbol: string;         // 銘柄シンボル（例: "BTC/USDT"）
  baseCoin: string;       // 基軸通貨（例: "BTC"）
  quoteCoin: string;      // 取引通貨（例: "USDT"）
  minOrderSize: number;   // 最小注文量
  pricePrecision: number; // 価格精度
  quantityPrecision: number; // 数量精度
  status: string;         // 取引状態（'online'、'offline'など）
  exchangeType: ExchangeType; // 取引所タイプ
}

/**
 * 銘柄フィルタリングオプション
 */
export interface SymbolFilterOptions {
  searchText?: string;    // 検索テキスト
  favorite?: boolean;     // お気に入りのみ表示
  status?: string;        // 特定の状態のみ表示
  quoteCoin?: string;     // 特定の取引通貨のみ表示（例: "USDT"のみ）
  exchangeType?: ExchangeType; // 特定の取引所のみ表示
}

/**
 * シンボルリストコンポーネントのプロパティ型
 */
export interface SymbolListProps {
  symbols: SymbolInfo[];
  isLoading: boolean;
  error: string | null;
  onSelectSymbol?: (symbol: string) => void;
} 