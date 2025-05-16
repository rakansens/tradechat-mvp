// store/entry/state.ts
// エントリースライスの状態と初期値を定義
// 更新: 2025/6/1 - ローディングとエラー状態を追加
// 更新: T-7.5フェーズ - userIdフィールドを追加

import type { Entry, OpenEntry } from '@/types/entry'

// エントリースライスの状態インターフェース
export interface EntrySliceState {
  entries: Entry[]
  pendingEntry: OpenEntry | null
  isLoading: boolean
  error: string | null
}

// エントリースライスの初期状態
export const initialEntryState: EntrySliceState = {
  // 初期サンプルエントリー
  entries: [
    {
      id: "1",
      userId: "example-user-1",
      side: "buy",
      symbol: "BTC/USD",
      price: 58750,
      time: "2023-05-01T10:30:00Z",
      status: "closed",
      exitPrice: 61200,
      exitTime: "2023-05-02T14:45:00Z",
      profit: 2450,
    },
    {
      id: "2",
      userId: "example-user-1",
      side: "sell",
      symbol: "BTC/USD",
      price: 62500,
      time: "2023-05-03T09:15:00Z",
      status: "closed",
      exitPrice: 59800,
      exitTime: "2023-05-04T16:20:00Z",
      profit: 2700,
    },
    {
      id: "3",
      userId: "example-user-1",
      side: "buy",
      symbol: "BTC/USD",
      price: 59200,
      time: "2023-05-05T11:00:00Z",
      status: "open",
    },
  ],
  pendingEntry: null,
  isLoading: false,
  error: null
} 