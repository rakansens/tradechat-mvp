import { renderHook } from '@testing-library/react';
import { useDebugStores } from '../store/useDebugStores';
import { useRootStore } from '@/store/rootStore';
import { cacheService } from '@/services/cache';
import { requestHistoryService } from '@/services/history';

// モックの型定義
type MockFunction<T = any> = jest.Mock<T>;

// モックの設定
jest.mock('@/store/rootStore', () => ({
  __esModule: true,
  useRootStore: jest.fn()
}));

jest.mock('@/services/cache', () => ({
  cacheService: {
    getStats: jest.fn()
  }
}));
jest.mock('@/services/history', () => ({
  requestHistoryService: {
    getHistory: jest.fn()
  }
}));

describe('useDebugStores', () => {
  // モックデータ
  const mockActiveFetches = [{ type: 'test', symbol: 'BTC', exchangeType: 'spot', duration: 5000 }];
  const mockPollingStatus = { orderbook: { active: true, interval: 5000 } };
  const mockSymbolHistory = [{ from: 'BTC', to: 'ETH', reason: 'test', timestamp: Date.now() }];
  const mockCacheStats = { totalEntries: 5, entries: [{ key: 'test', age: 1000 }] };
  const mockRequestHistory = [{ key: 'req1', status: 'completed', duration: 200 }];
  
  // モック関数
  const mockGetActiveFetchesInfo = jest.fn().mockReturnValue(mockActiveFetches);
  const mockGetPollingStatus = jest.fn().mockReturnValue(mockPollingStatus);
  const mockGetSymbolChangeHistory = jest.fn().mockReturnValue(mockSymbolHistory);
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // モックの実装
    (useRootStore as unknown as MockFunction).mockImplementation((selector) => {
      // DebugSliceのセレクタの場合
      if (selector.name === 'debugSelector') {
        return {
          isDebugMode: true,
          toggleDebugMode: jest.fn(),
          getActiveFetchesInfo: mockGetActiveFetchesInfo,
          getPollingStatus: mockGetPollingStatus
        };
      }
      
      // SymbolSliceのセレクタの場合
      if (selector.name === 'symbolSelector') {
        return {
          getSymbolChangeHistory: mockGetSymbolChangeHistory
        };
      }
      
      return {};
    });
    
    // サービスモック
    (cacheService.getStats as jest.Mock).mockReturnValue(mockCacheStats);
    (requestHistoryService.getHistory as jest.Mock).mockReturnValue(mockRequestHistory);
  });
  
  test('デバッグモードがtrueの場合、すべてのデバッグ情報を返す', () => {
    // フックをレンダリング
    const { result } = renderHook(() => useDebugStores());
    
    // 状態を確認
    expect(result.current.isDebugMode).toBe(true);
    
    // refreshDebugInfo関数を実行
    const debugInfo = result.current.refreshDebugInfo();
    
    // 結果を確認
    expect(debugInfo.activeFetches).toEqual(mockActiveFetches);
    expect(debugInfo.pollingStatus).toEqual(mockPollingStatus);
    expect(debugInfo.symbolHistory).toEqual(mockSymbolHistory);
    expect(debugInfo.cacheStats).toEqual(mockCacheStats);
    expect(debugInfo.requestHistory).toEqual(mockRequestHistory);
    
    // 各関数が呼び出されたことを確認
    expect(mockGetActiveFetchesInfo).toHaveBeenCalledTimes(1);
    expect(mockGetPollingStatus).toHaveBeenCalledTimes(1);
    expect(mockGetSymbolChangeHistory).toHaveBeenCalledTimes(1);
    expect(cacheService.getStats).toHaveBeenCalledTimes(1);
    expect(requestHistoryService.getHistory).toHaveBeenCalledTimes(1);
  });
  
  test('デバッグモードがfalseの場合、空のデバッグ情報を返す', () => {
    // デバッグモードをfalseに設定
    (useRootStore as unknown as MockFunction).mockImplementation((selector) => {
      // DebugSliceのセレクタの場合
      if (selector.name === 'debugSelector') {
        return {
          isDebugMode: false,
          toggleDebugMode: jest.fn(),
          getActiveFetchesInfo: mockGetActiveFetchesInfo,
          getPollingStatus: mockGetPollingStatus
        };
      }
      
      // SymbolSliceのセレクタの場合
      if (selector.name === 'symbolSelector') {
        return {
          getSymbolChangeHistory: mockGetSymbolChangeHistory
        };
      }
      
      return {};
    });
    
    // フックをレンダリング
    const { result } = renderHook(() => useDebugStores());
    
    // 状態を確認
    expect(result.current.isDebugMode).toBe(false);
    
    // refreshDebugInfo関数を実行
    const debugInfo = result.current.refreshDebugInfo();
    
    // 結果を確認 - 空のオブジェクトが返されるはず
    expect(debugInfo.activeFetches).toEqual([]);
    expect(debugInfo.pollingStatus).toEqual({});
    expect(debugInfo.symbolHistory).toEqual([]);
    expect(debugInfo.cacheStats).toEqual({});
    expect(debugInfo.requestHistory).toEqual([]);
    
    // 各関数が呼び出されていないことを確認
    expect(mockGetActiveFetchesInfo).not.toHaveBeenCalled();
    expect(mockGetPollingStatus).not.toHaveBeenCalled();
    expect(mockGetSymbolChangeHistory).not.toHaveBeenCalled();
    expect(cacheService.getStats).not.toHaveBeenCalled();
    expect(requestHistoryService.getHistory).not.toHaveBeenCalled();
  });
  
  test('サービス呼び出しでエラーが発生した場合も処理を続行する', () => {
    // エラーをスローするようにモックを設定
    (cacheService.getStats as jest.Mock).mockImplementation(() => {
      throw new Error('Cache service error');
    });
    
    // コンソールエラーをスパイ
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // フックをレンダリング
    const { result } = renderHook(() => useDebugStores());
    
    // refreshDebugInfo関数を実行
    const debugInfo = result.current.refreshDebugInfo();
    
    // エラーにもかかわらずストアからの情報は取得できていることを確認
    expect(debugInfo.activeFetches).toEqual(mockActiveFetches);
    expect(debugInfo.pollingStatus).toEqual(mockPollingStatus);
    expect(debugInfo.symbolHistory).toEqual(mockSymbolHistory);
    
    // エラーが発生したサービスからの情報は空になっていることを確認
    expect(debugInfo.cacheStats).toEqual({});
    
    // エラーログが出力されたことを確認
    expect(console.error).toHaveBeenCalled();
  });
}); 