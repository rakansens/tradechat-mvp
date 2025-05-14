// store/entry/actions.ts
// エントリースライスのアクション
// 更新: 2025/6/1 - APIエンドポイントとの連携機能を追加

import type { Entry, OpenEntry } from "@/types/entry"
import type { EntrySliceState } from "./state"

// エントリースライスのアクション定義
export interface EntrySliceActions {
  // 保留中のエントリーを設定するアクション
  setPendingEntry: (entry: OpenEntry | null) => void
  
  // エントリーを実行（確定）するアクション
  executeEntry: () => Promise<void>
  
  // ユーザーのエントリーを取得するアクション
  fetchUserEntries: () => Promise<void>
  
  // 取引を終了するアクション
  closePosition: (entryId: string, exitPrice: number) => Promise<void>
  
  // 取引をキャンセルするアクション
  cancelPosition: (entryId: string) => Promise<void>
  
  // エントリーを削除するアクション
  deleteEntry: (entryId: string) => Promise<void>
  
  // エントリーを設定するアクション（主に内部使用）
  setEntries: (entries: Entry[]) => void
  
  // ローディング状態を設定するアクション
  setLoading: (isLoading: boolean) => void
  
  // エラーを設定するアクション
  setError: (error: string | null) => void
}

// エントリースライスのアクション作成関数
export const createEntryActions = (
  set: (fn: (state: EntrySliceState) => void) => void,
  get: () => EntrySliceState
): EntrySliceActions => ({
  
  // 保留中のエントリーを設定するアクション
  setPendingEntry: (pendingEntry) => {
    set((state) => {
      state.pendingEntry = pendingEntry
    })
  },
  
  // APIからユーザーのエントリーを取得するアクション
  fetchUserEntries: async () => {
    set((state) => {
      state.isLoading = true
      state.error = null
    })
    
    try {
      const response = await fetch('/api/entries')
      
      if (!response.ok) {
        throw new Error(`エントリーの取得に失敗しました: ${response.statusText}`)
      }
      
      const entries = await response.json()
      
      set((state) => {
        state.entries = entries
        state.isLoading = false
      })
    } catch (error) {
      console.error('エントリー取得エラー:', error)
      set((state) => {
        state.error = error instanceof Error ? error.message : '不明なエラー'
        state.isLoading = false
      })
    }
  },
  
  // エントリーを実行（確定）するアクション
  executeEntry: async () => {
    const { pendingEntry } = get()
    
    if (!pendingEntry) {
      return
    }
    
    set((state) => {
      state.isLoading = true
      state.error = null
    })
    
    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          side: pendingEntry.side,
          symbol: pendingEntry.symbol,
          price: pendingEntry.price,
          time: pendingEntry.time,
          takeProfit: pendingEntry.takeProfit,
          stopLoss: pendingEntry.stopLoss,
          isPublic: false
        }),
      })
      
      if (!response.ok) {
        throw new Error(`エントリーの作成に失敗しました: ${response.statusText}`)
      }
      
      const newEntry = await response.json()
      
      set((state) => {
        state.entries = [...state.entries, newEntry]
        state.pendingEntry = null
        state.isLoading = false
      })
    } catch (error) {
      console.error('エントリー作成エラー:', error)
      set((state) => {
        state.error = error instanceof Error ? error.message : '不明なエラー'
        state.isLoading = false
      })
    }
  },
  
  // 取引を終了するアクション
  closePosition: async (entryId, exitPrice) => {
    set((state) => {
      state.isLoading = true
      state.error = null
    })
    
    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'close',
          exitPrice: exitPrice,
          exitTime: new Date().toISOString()
        }),
      })
      
      if (!response.ok) {
        throw new Error(`ポジションのクローズに失敗しました: ${response.statusText}`)
      }
      
      const updatedEntry = await response.json()
      
      set((state) => {
        state.entries = state.entries.map((entry) => {
          if (entry.id === entryId) {
            return updatedEntry
          }
          return entry
        })
        state.isLoading = false
      })
    } catch (error) {
      console.error('ポジションクローズエラー:', error)
      set((state) => {
        state.error = error instanceof Error ? error.message : '不明なエラー'
        state.isLoading = false
      })
    }
  },
  
  // 取引をキャンセルするアクション
  cancelPosition: async (entryId) => {
    set((state) => {
      state.isLoading = true
      state.error = null
    })
    
    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel'
        }),
      })
      
      if (!response.ok) {
        throw new Error(`ポジションのキャンセルに失敗しました: ${response.statusText}`)
      }
      
      const updatedEntry = await response.json()
      
      set((state) => {
        state.entries = state.entries.map((entry) => {
          if (entry.id === entryId) {
            return updatedEntry
          }
          return entry
        })
        state.isLoading = false
      })
    } catch (error) {
      console.error('ポジションキャンセルエラー:', error)
      set((state) => {
        state.error = error instanceof Error ? error.message : '不明なエラー'
        state.isLoading = false
      })
    }
  },
  
  // エントリーを削除するアクション
  deleteEntry: async (entryId) => {
    set((state) => {
      state.isLoading = true
      state.error = null
    })
    
    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`エントリーの削除に失敗しました: ${response.statusText}`)
      }
      
      set((state) => {
        state.entries = state.entries.filter((entry) => entry.id !== entryId)
        state.isLoading = false
      })
    } catch (error) {
      console.error('エントリー削除エラー:', error)
      set((state) => {
        state.error = error instanceof Error ? error.message : '不明なエラー'
        state.isLoading = false
      })
    }
  },
  
  // エントリーを設定するアクション（主に内部使用）
  setEntries: (entries) => {
    set((state) => {
      state.entries = entries
    })
  },
  
  // ローディング状態を設定するアクション
  setLoading: (isLoading) => {
    set((state) => {
      state.isLoading = isLoading
    })
  },
  
  // エラーを設定するアクション
  setError: (error) => {
    set((state) => {
      state.error = error
    })
  }
}) 