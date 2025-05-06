// store/entry/selectors.ts
// 作成: エントリーストア用のメモ化されたセレクター関数
// 
// このファイルはZustandストアのパフォーマンスを向上させるためのメモ化されたセレクター関数を提供します。

import { createSelector } from 'reselect';
import type { EntryState, Entry, OpenEntry, ClosedEntry } from '@/types/entry';

// 基本セレクター
export const selectEntries = (state: EntryState) => state.entries;
export const selectPendingEntry = (state: EntryState) => state.pendingEntry;

// メモ化されたセレクター
export const selectOpenEntries = createSelector(
  [selectEntries],
  (entries: Entry[]): OpenEntry[] => {
    return entries.filter(entry => entry.status === 'open') as OpenEntry[];
  }
);

export const selectClosedEntries = createSelector(
  [selectEntries],
  (entries: Entry[]): ClosedEntry[] => {
    return entries.filter(entry => entry.status === 'closed') as ClosedEntry[];
  }
);

export const selectCanceledEntries = createSelector(
  [selectEntries],
  (entries: Entry[]): Entry[] => {
    return entries.filter(entry => entry.status === 'canceled');
  }
);

// 最新のエントリーを選択するセレクター
export const selectLatestEntry = createSelector(
  [selectEntries],
  (entries: Entry[]): Entry | null => {
    if (!entries || entries.length === 0) return null;
    return entries[entries.length - 1];
  }
);

// 利益のあるエントリーを選択するセレクター
export const selectProfitableEntries = createSelector(
  [selectClosedEntries],
  (closedEntries: ClosedEntry[]): ClosedEntry[] => {
    return closedEntries.filter(entry => entry.profit && entry.profit > 0);
  }
);

// 損失のあるエントリーを選択するセレクター
export const selectLossEntries = createSelector(
  [selectClosedEntries],
  (closedEntries: ClosedEntry[]): ClosedEntry[] => {
    return closedEntries.filter(entry => entry.profit && entry.profit < 0);
  }
);

// 総利益を計算するセレクター
export const selectTotalProfit = createSelector(
  [selectClosedEntries],
  (closedEntries: ClosedEntry[]): number => {
    return closedEntries.reduce((total, entry) => {
      return total + (entry.profit || 0);
    }, 0);
  }
);

// 型ガード関数
export function isOpenEntry(entry: Entry): entry is OpenEntry {
  return entry.status === 'open';
}

export function isClosedEntry(entry: Entry): entry is ClosedEntry {
  return entry.status === 'closed';
}
