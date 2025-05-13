// __tests__/store/entry.test.ts
// エントリースライスのテスト

import { useRootStore } from '@/store/rootStore'
import { 
  selectEntries, 
  selectPendingEntry, 
  selectOpenEntries, 
  selectClosedEntries 
} from '@/store/entry/selectors'
import type { OpenEntry } from '@/types/entry'

// モック用のヘルパー関数
const setupStore = () => {
  // テスト前にストアをリセット
  useRootStore.setState({
    entries: [],
    pendingEntry: null
  })
}

// テスト用のモックエントリー
const mockOpenEntry: OpenEntry = {
  id: 'test-entry-1',
  side: 'buy',
  symbol: 'BTC/USD',
  price: 50000,
  time: new Date().toISOString(),
  status: 'open'
}

describe('Entry Slice', () => {
  beforeEach(() => {
    setupStore()
  })
  
  describe('Actions', () => {
    it('should set pending entry', () => {
      useRootStore.getState().setPendingEntry(mockOpenEntry)
      expect(useRootStore.getState().pendingEntry).toEqual(mockOpenEntry)
    })
    
    it('should execute entry and clear pending entry', () => {
      // 初期状態を確認
      expect(useRootStore.getState().entries.length).toBe(0)
      expect(useRootStore.getState().pendingEntry).toBeNull()
      
      // 保留中のエントリーを設定してから実行
      useRootStore.getState().setPendingEntry(mockOpenEntry)
      useRootStore.getState().executeEntry()
      
      // 実行後の状態を確認
      const state = useRootStore.getState()
      expect(state.entries.length).toBe(1)
      expect(state.entries[0]).toEqual(mockOpenEntry)
      expect(state.pendingEntry).toBeNull()
    })
    
    it('should close position', () => {
      // まずエントリーを追加
      useRootStore.getState().setPendingEntry(mockOpenEntry)
      useRootStore.getState().executeEntry()
      
      // エントリーを終了
      const exitPrice = 55000
      useRootStore.getState().closePosition(mockOpenEntry.id, exitPrice)
      
      // 終了後の状態を確認
      const state = useRootStore.getState()
      const closedEntry = state.entries[0]
      
      expect(closedEntry.status).toBe('closed')
      expect(closedEntry.exitPrice).toBe(exitPrice)
      expect(closedEntry.profit).toBe(5000) // 買いポジションで5000の利益
    })
    
    it('should cancel position', () => {
      // まずエントリーを追加
      useRootStore.getState().setPendingEntry(mockOpenEntry)
      useRootStore.getState().executeEntry()
      
      // エントリーをキャンセル
      useRootStore.getState().cancelPosition(mockOpenEntry.id)
      
      // キャンセル後の状態を確認
      const state = useRootStore.getState()
      const canceledEntry = state.entries[0]
      
      expect(canceledEntry.status).toBe('canceled')
    })
  })
  
  describe('Selectors', () => {
    beforeEach(() => {
      // テストデータをセットアップ
      const store = useRootStore.getState()
      store.entries = [
        {
          id: '1',
          side: 'buy',
          symbol: 'BTC/USD',
          price: 50000,
          time: '2023-01-01T00:00:00Z',
          status: 'open'
        },
        {
          id: '2',
          side: 'sell',
          symbol: 'ETH/USD',
          price: 3000,
          time: '2023-01-02T00:00:00Z',
          status: 'closed',
          exitPrice: 2800,
          exitTime: '2023-01-03T00:00:00Z',
          profit: 200
        }
      ]
    })
    
    it('should select all entries', () => {
      const entries = selectEntries(useRootStore.getState())
      expect(entries.length).toBe(2)
    })
    
    it('should select open entries', () => {
      const openEntries = selectOpenEntries(useRootStore.getState())
      expect(openEntries.length).toBe(1)
      expect(openEntries[0].id).toBe('1')
      expect(openEntries[0].status).toBe('open')
    })
    
    it('should select closed entries', () => {
      const closedEntries = selectClosedEntries(useRootStore.getState())
      expect(closedEntries.length).toBe(1)
      expect(closedEntries[0].id).toBe('2')
      expect(closedEntries[0].status).toBe('closed')
    })
  })
}) 