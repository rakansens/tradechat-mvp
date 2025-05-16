/**
 * オーダーブック関連の共通型定義
 * 
 * このファイルはオーダーブック関連の型定義を集約し、
 * chart.tsとmarket.tsでの重複を解消するために作成されました。
 * 全てのオーダーブック関連コンポーネントはこのファイルから型をインポートする必要があります。
 */

/**
 * オーダーブックエントリーの型
 * 価格レベルごとの注文量を表します
 */
export interface OrderBookEntry {
  price: number;
  amount: number;
  total?: number; // UI表示用の累積数量
}

/**
 * オーダーブックデータの型
 * 板情報全体を表します
 */
export interface OrderBookData {
  symbol?: string;
  timestamp: number;
  bids: OrderBookEntry[] | [string, string][]; // 買い注文 (価格, 数量)のペア
  asks: OrderBookEntry[] | [string, string][]; // 売り注文 (価格, 数量)のペア
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

/**
 * Bitget取引所のオーダーブックAPIレスポンス型
 * API固有の型定義なので、将来的にはnetwork/apiドメインに移動する可能性があります
 */
export interface BitgetOrderBookResponse {
  code: string;
  data: {
    asks: string[][];
    bids: string[][];
    timestamp: string;
  };
  msg: string;
} 