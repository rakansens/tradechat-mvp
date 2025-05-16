// types/store/entry.ts
// 作成: 2025-10-07 - エントリーストア関連の型定義
// 更新: 2025-10-08 - S-1フェーズ: store/entry/state.tsの定義を統合

import { ExchangeType } from '@/types/constants/enums';
import type { Entry, OpenEntry, ClosedEntry, CanceledEntry } from '@/types/entry';

/**
 * このファイルはエントリーストアの型定義を提供します。
 * 型定義の二重化解消のため正規ルートとして定義されます。
 */

// 必要な型を再エクスポート
export type { 
  Entry, 
  OpenEntry, 
  ClosedEntry, 
  CanceledEntry
};

// エントリースライスの状態インターフェース
export interface EntryState {
  entries: Entry[];
  pendingEntry: OpenEntry | null;
  isLoading: boolean;
  error: string | null;
  filter: EntryFilterOptions;
}

// エントリーフィルターオプション
export interface EntryFilterOptions {
  status?: 'open' | 'closed' | 'canceled' | 'all';
  symbol?: string;
  direction?: 'long' | 'short' | 'all';
  exchangeType?: ExchangeType | 'all';
  sortBy?: 'createdAt' | 'entryPrice' | 'pnl' | 'pnlPercentage';
  sortDirection?: 'asc' | 'desc';
}

// エントリースライスのアクション定義
export interface EntryActions {
  addEntry: (entry: Entry) => void;
  updateEntry: (id: string, entry: Partial<Entry>) => void;
  deleteEntry: (id: string) => void;
  setEntries: (entries: Entry[]) => void;
  setPendingEntry: (entry: OpenEntry | null) => void;
  executeEntry: () => void;
  closePosition: (entryId: string, exitPrice: number) => void;
  cancelPosition: (entryId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: Partial<EntryFilterOptions>) => void;
}

// 完全なエントリースライスの型定義
export type EntrySlice = EntryState & EntryActions; 