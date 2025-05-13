import { renderHook, act } from '@testing-library/react';
import { useDebugPanel } from '@/hooks/useDebugPanel';
import { getStoredLogs, clearStoredLogs, StoredLog } from '@/utils/logStorage';

// モック
jest.mock('@/utils/logStorage', () => ({
  getStoredLogs: jest.fn(),
  clearStoredLogs: jest.fn(),
  StoredLog: {},
}));

jest.mock('@/store/useDebugStore', () => ({
  useDebugStore: jest.fn((selector) => {
    // モックストアの状態を定義
    const state = {
      isDebugMode: true,
      toggleDebugMode: jest.fn(),
      getActiveFetchesInfo: jest.fn().mockReturnValue([]),
      getPollingStatus: jest.fn().mockReturnValue({}),
    };
    return selector(state);
  }),
}));

jest.mock('@/store/useSymbolStore', () => ({
  useSymbolStore: jest.fn((selector) => {
    const state = {
      getSymbolChangeHistory: jest.fn().mockReturnValue([]),
    };
    return selector(state);
  }),
}));

jest.mock('@/services/cache', () => ({
  cacheService: {
    getStats: jest.fn().mockReturnValue({ totalEntries: 0, entries: [] }),
  },
}));

jest.mock('@/services/history', () => ({
  requestHistoryService: {
    getHistory: jest.fn().mockReturnValue([]),
  },
}));

// テストの実行前にモックをリセット
beforeEach(() => {
  jest.clearAllMocks();
  
  // デフォルトのログをモック
  (getStoredLogs as jest.Mock).mockReturnValue([
    { level: 'error' as const, message: 'エラーログ', timestamp: new Date().toISOString() },
    { level: 'warn' as const, message: '警告ログ', timestamp: new Date().toISOString() },
    { level: 'info' as const, message: '情報ログ', timestamp: new Date().toISOString() },
  ]);
});

describe('useDebugPanel', () => {
  it('初期状態で全てのログを取得する', () => {
    const { result } = renderHook(() => useDebugPanel());
    
    // refreshLogsが呼ばれたことを確認
    expect(getStoredLogs).toHaveBeenCalled();
    
    // logsに全てのログが設定されていることを確認
    expect(result.current.logs.length).toBe(3);
  });
  
  it('activeTabが変更されるとログがフィルタリングされる', () => {
    const { result } = renderHook(() => useDebugPanel());
    
    // 初期状態では全てのログが表示される
    expect(result.current.logs.length).toBe(3);
    
    // エラーログのみに絞り込み
    act(() => {
      result.current.setActiveTab('error');
    });
    
    // getStoredLogsが再度呼ばれる
    expect(getStoredLogs).toHaveBeenCalledTimes(2);
  });
  
  it('ログをクリアする', () => {
    const { result } = renderHook(() => useDebugPanel());
    
    act(() => {
      result.current.handleClearLogs();
    });
    
    // clearStoredLogsが呼ばれたことを確認
    expect(clearStoredLogs).toHaveBeenCalled();
    
    // logsが空になることを確認
    expect(result.current.logs.length).toBe(0);
  });
  
  // 以下はsetIntervalをモックする必要があるため、より高度なテスト
  it('デバッグモードが有効なとき定期的に更新される', () => {
    // setIntervalのモック
    jest.useFakeTimers();
    
    renderHook(() => useDebugPanel());
    
    // 最初の更新でgetStoredLogsとデバッグ情報取得が呼ばれていることを確認
    expect(getStoredLogs).toHaveBeenCalledTimes(1);
    
    // タイマーを進める
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    // 2回目の更新が行われることを確認
    expect(getStoredLogs).toHaveBeenCalledTimes(2);
    
    // クリーンアップ
    jest.useRealTimers();
  });
}); 