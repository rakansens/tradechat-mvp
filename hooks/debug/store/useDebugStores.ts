// hooks/debug/store/useDebugStores.ts
// テスト用スタブ

/**
 * デバッグ関連のストア参照を集約するフック - テスト用スタブ
 */
export function useDebugStores() {
  return {
    // デバッグモードの状態
    isDebugMode: false,
    toggleDebugMode: () => {},
    
    // 各ストアの情報を返す関数
    getDebugStoreInfo: () => ({
      symbolStore: {
        currentSymbol: 'BTC/USD',
        status: 'ready'
      },
      chartStore: {
        currentData: [],
        status: 'ready'
      }
    }),
    
    // デバッグ情報更新関数
    refreshDebugInfo: () => ({
      activeFetches: [],
      pollingStatus: {},
      symbolHistory: [],
      cacheStats: {},
      requestHistory: []
    })
  };
} 