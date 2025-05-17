// hooks/chart/__tests__/useToolbarEvents.test.ts
// 作成: useToolbarEventsフックのテスト
// 役割:
// 1. イベントリスナーの登録処理の検証
// 2. イベント発火時のストア更新の検証
// 3. クリーンアップ時のリスナー削除の検証

import { renderHook } from '@testing-library/react-hooks';
import { useToolbarEvents } from '../useToolbarEvents';
<<<<<<< ours
<<<<<<< ours
import { useChartDataStore } from '@/store/chart/data';
import { useSymbolStore } from '@/store/symbol';
=======
import { useChartDataStore } from '@/store/chart/data';
import { useSymbolStore } from '@/store';
>>>>>>> theirs

// モック
jest.mock('@/store/chart/data', () => ({
  useChartDataStore: {
    setState: jest.fn()
  }
}));
<<<<<<< ours
jest.mock('@/store/symbol', () => ({
=======

jest.mock('@/store', () => ({
>>>>>>> theirs
  useSymbolStore: {
=======
import { useRootStore } from '@/store';

// モック
jest.mock('@/store', () => ({
  useRootStore: {
    setState: jest.fn(),
>>>>>>> theirs
    getState: jest.fn(() => ({
      setCurrentSymbol: jest.fn()
    }))
  }
}));

describe('useToolbarEvents', () => {
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // windowオブジェクトのaddEventListenerとremoveEventListenerをスパイする
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
  });
  
  afterEach(() => {
    // スパイをリセットする
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
    
    // モックをリセットする
    jest.clearAllMocks();
  });
  
  it('マウント時にイベントリスナーが登録される', () => {
    renderHook(() => useToolbarEvents());
    
    // 2つのイベントリスナーが登録されたことを検証
    expect(addEventListenerSpy).toHaveBeenCalledTimes(2);
    expect(addEventListenerSpy).toHaveBeenCalledWith('updateToolbarTimeframe', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('updateToolbarSymbol', expect.any(Function));
  });
  
  it('アンマウント時にイベントリスナーが削除される', () => {
    const { unmount } = renderHook(() => useToolbarEvents());
    
    // アンマウントする
    unmount();
    
    // イベントリスナーが削除されたことを検証
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(2);
    expect(removeEventListenerSpy).toHaveBeenCalledWith('updateToolbarTimeframe', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('updateToolbarSymbol', expect.any(Function));
  });
  
  it('時間足変更イベントが発火するとStateが更新される', () => {
    renderHook(() => useToolbarEvents());
    
    // 時間足変更イベントを発火
    const timeframeEvent = new CustomEvent('updateToolbarTimeframe', {
      detail: { timeframe: '1h' }
    });
    window.dispatchEvent(timeframeEvent);
    
    // ストアのsetStateが呼ばれたことを検証
    expect(useRootStore.setState).toHaveBeenCalledWith({ currentTimeFrame: '1h' });
  });
  
  it('銘柄変更イベントが発火するとシンボルが更新される', () => {
    renderHook(() => useToolbarEvents());
    
    // 銘柄変更イベントを発火
    const symbolEvent = new CustomEvent('updateToolbarSymbol', {
      detail: { symbol: 'ETH-USD' }
    });
    window.dispatchEvent(symbolEvent);
    
    // RootStoreのsetCurrentSymbolが呼ばれたことを検証
    expect(useRootStore.getState).toHaveBeenCalled();
    expect(useRootStore.getState().setCurrentSymbol).toHaveBeenCalledWith('ETH-USD', 'ToolbarEvents.updateSymbol');
  });
});