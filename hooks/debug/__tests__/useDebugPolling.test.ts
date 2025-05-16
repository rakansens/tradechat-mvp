import { renderHook, act } from '@testing-library/react';
import { useDebugPolling } from "../utils/useDebugPolling";

// グローバルのsetIntervalとclearIntervalをモック
jest.useFakeTimers();

describe('useDebugPolling', () => {
  // テスト前にタイマーをリセット
  beforeEach(() => {
    jest.clearAllTimers();
  });
  
  test('isDebugMode=trueの場合、ポーリングを開始する', () => {
    // スパイ関数
    const refreshFn1 = jest.fn();
    const refreshFn2 = jest.fn();
    
    // フックをレンダリング
    const { result } = renderHook(() => 
      useDebugPolling({
        isDebugMode: true,
        refreshFunctions: [refreshFn1, refreshFn2],
        interval: 2000
      })
    );
    
    // 初期状態でポーリングがアクティブであることを確認
    expect(result.current.isPolling).toBe(true);
    
    // インターバルIDが設定されていることを確認
    expect(result.current.refreshInterval).not.toBeNull();
    
    // 時間を進める
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    // 関数が1回ずつ呼び出されたことを確認
    expect(refreshFn1).toHaveBeenCalledTimes(1);
    expect(refreshFn2).toHaveBeenCalledTimes(1);
    
    // さらに時間を進める
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    // 関数が2回ずつ呼び出されたことを確認
    expect(refreshFn1).toHaveBeenCalledTimes(2);
    expect(refreshFn2).toHaveBeenCalledTimes(2);
  });
  
  test('isDebugMode=falseの場合、ポーリングを開始しない', () => {
    // スパイ関数
    const refreshFn = jest.fn();
    
    // フックをレンダリング
    const { result } = renderHook(() => 
      useDebugPolling({
        isDebugMode: false,
        refreshFunctions: [refreshFn],
        interval: 2000
      })
    );
    
    // ポーリングが非アクティブであることを確認
    expect(result.current.isPolling).toBe(false);
    
    // インターバルIDがnullであることを確認
    expect(result.current.refreshInterval).toBeNull();
    
    // 時間を進める
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    // 関数が呼び出されていないことを確認
    expect(refreshFn).not.toHaveBeenCalled();
  });
  
  test('isDebugMode=trueからfalseに変わると、ポーリングを停止する', () => {
    // スパイ関数
    const refreshFn = jest.fn();
    
    // フックをレンダリング
    const { result, rerender } = renderHook(
      ({ isDebugMode }) => 
        useDebugPolling({
          isDebugMode,
          refreshFunctions: [refreshFn],
          interval: 2000
        }),
      {
        initialProps: { isDebugMode: true }
      }
    );
    
    // 初期状態でポーリングがアクティブであることを確認
    expect(result.current.isPolling).toBe(true);
    
    // 時間を進める
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    // 関数が1回呼び出されたことを確認
    expect(refreshFn).toHaveBeenCalledTimes(1);
    
    // isDebugModeをfalseに変更
    rerender({ isDebugMode: false });
    
    // ポーリングが非アクティブになったことを確認
    expect(result.current.isPolling).toBe(false);
    
    // さらに時間を進める
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    
    // 関数の呼び出し回数が変わっていないことを確認
    expect(refreshFn).toHaveBeenCalledTimes(1);
  });
  
  test('refreshFunctionsが更新されると、新しい関数が呼び出される', () => {
    // スパイ関数
    const refreshFn1 = jest.fn();
    const refreshFn2 = jest.fn();
    
    // フックをレンダリング
    const { result, rerender } = renderHook(
      ({ refreshFunctions }) => 
        useDebugPolling({
          isDebugMode: true,
          refreshFunctions,
          interval: 2000
        }),
      {
        initialProps: { refreshFunctions: [refreshFn1] }
      }
    );
    
    // 時間を進める
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    // 最初の関数のみが呼び出されたことを確認
    expect(refreshFn1).toHaveBeenCalledTimes(1);
    expect(refreshFn2).not.toHaveBeenCalled();
    
    // 関数配列を更新
    rerender({ refreshFunctions: [refreshFn1, refreshFn2] });
    
    // 時間を進める
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    // 両方の関数が呼び出されたことを確認
    expect(refreshFn1).toHaveBeenCalledTimes(2);
    expect(refreshFn2).toHaveBeenCalledTimes(1);
  });
}); 