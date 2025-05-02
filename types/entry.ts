// types/entry.ts
// 作成: トレードエントリー関連の型定義

/**
 * トレードの方向（買い/売り）
 */
export type TradeSide = "buy" | "sell";

/**
 * エントリー（トレードポジション）の状態
 */
export type EntryStatus = "open" | "closed" | "canceled";

/**
 * 基本的なエントリー情報の共通インターフェース
 */
export interface BaseEntry {
  id: string;           // エントリーの一意識別子
  side: TradeSide;      // 買いか売りか
  symbol: string;       // 取引対象の通貨ペア（例: "BTC/USD"）
  price: number;        // エントリー価格
  time: string;         // エントリー時間（ISO形式）
  takeProfit?: number;  // 利確価格（オプション）
  stopLoss?: number;    // 損切り価格（オプション）
}

/**
 * オープン（未決済）状態のエントリー
 */
export interface OpenEntry extends BaseEntry {
  status: "open";
}

/**
 * クローズ（決済済み）状態のエントリー
 */
export interface ClosedEntry extends BaseEntry {
  status: "closed";
  exitPrice: number;    // 決済価格
  exitTime: string;     // 決済時間（ISO形式）
  profit: number;       // 利益額（マイナスの場合は損失）
}

/**
 * キャンセル状態のエントリー
 */
export interface CanceledEntry extends BaseEntry {
  status: "canceled";
}

/**
 * エントリーの共用型（オープン、クローズ、キャンセルのいずれか）
 */
export type Entry = OpenEntry | ClosedEntry | CanceledEntry;

/**
 * エントリーストアの状態型
 */
export interface EntryState {
  // 状態
  entries: Entry[];
  pendingEntry: OpenEntry | null;

  // アクション
  setPendingEntry: (entry: OpenEntry | null) => void;
  executeEntry: () => void;
  closePosition: (entryId: string, exitPrice: number) => void;
  cancelPosition: (entryId: string) => void;
}
