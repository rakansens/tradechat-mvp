/**
 * オーダーブック関連の共通型定義
 * 
 * このファイルはオーダーブック関連の型定義を集約し、
 * chart.tsとmarket.tsでの重複を解消するために作成されました。
 */

/**
 * オーダーブックエントリーの型
 */
export interface OrderBookEntry {
  price: number;
  amount: number;
  total?: number; // UI表示用の累積数量
}

/**
 * オーダーブックデータの型
 */
export interface OrderBookData {
  symbol?: string;
  timestamp: number;
  bids: OrderBookEntry[] | [string, string][]; // 買い注文
  asks: OrderBookEntry[] | [string, string][]; // 売り注文
}

/**
 * オーダーブックコンポーネントのプロパティ型
 */
export interface OrderBookProps {
  data: OrderBookData | null;
  isLoading: boolean;
  error: string | null;
  depth?: number; // 表示する深さ（デフォルト値はコンポーネントで設定）
} 