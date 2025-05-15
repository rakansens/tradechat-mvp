/**
 * @deprecated このファイルはT-4フェーズで非推奨となりました。代わりに types/entry/base.ts を使用してください。
 * 後方互換性のために保持されていますが、今後は types/entry からインポートすることを推奨します。
 * 
 * 更新日: 2023/6/25 - Supabase型定義に合わせてプロパティ名とタイプを更新
 */

// types/entry.ts
// 作成: トレードエントリー関連の型定義

import { Entry as SupabaseEntry } from '@/lib/supabase/features/entry';

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
 * Supabaseのカラム命名規則（スネークケース）からキャメルケースへの変換
 */
export interface BaseEntry {
  id: string;           // エントリーの一意識別子
  userId: string;       // ユーザーID
  side: TradeSide;      // 買いか売りか
  symbol: string;       // 取引対象の通貨ペア（例: "BTC/USD"）
  price: number;        // エントリー価格
  time: string;         // エントリー時間（ISO形式）
  takeProfit?: number;  // 利確価格（オプション）
  stopLoss?: number;    // 損切り価格（オプション）
  isPublic?: boolean;   // 公開フラグ
  createdAt?: string;   // 作成日時
  updatedAt?: string;   // 更新日時
  status: EntryStatus;  // ステータス
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
 * Supabaseのエントリー型（スネークケース）からクライアント用エントリー型（キャメルケース）に変換
 */
export function fromSupabaseEntry(entry: SupabaseEntry): Entry {
  const base = {
    id: entry.id,
    userId: entry.user_id,
    side: entry.side as TradeSide,
    symbol: entry.symbol,
    price: entry.price,
    time: entry.time,
    takeProfit: entry.take_profit || undefined,
    stopLoss: entry.stop_loss || undefined,
    isPublic: entry.is_public || false,
    createdAt: entry.created_at || undefined,
    updatedAt: entry.updated_at || undefined,
    status: entry.status as EntryStatus,
  };

  if (entry.status === 'closed' && entry.exit_price && entry.exit_time) {
    return {
      ...base,
      status: 'closed',
      exitPrice: entry.exit_price,
      exitTime: entry.exit_time,
      profit: entry.profit || 0,
    } as ClosedEntry;
  } else if (entry.status === 'canceled') {
    return {
      ...base,
      status: 'canceled',
    } as CanceledEntry;
  } else {
    return {
      ...base,
      status: 'open',
    } as OpenEntry;
  }
}

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
