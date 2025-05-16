/**
 * __tests__/hooks/symbol/useFilterState.test.ts
 * useFilterStateフックのテストスイート
 * 更新: T-7.3フェーズ - インポートパスを types/validations に変更
 * 更新: T-7.5フェーズ - ストア参照パスを修正
 */

import { renderHook, act } from '@testing-library/react';
import { useFilterState } from '@/hooks/symbol/filter/useFilterState';
import { useSymbolStore } from '@/store/symbol';
import { validateFilterOptions } from '@/types/validations/symbol';

// モックの設定
jest.mock('@/store/symbol', () => ({
  useSymbolStore: jest.fn(),
}));

jest.mock('@/types/validations/symbol', () => ({
  validateFilterOptions: jest.fn(),
}));

describe('useFilterState', () => {
  // テスト前にモックをリセット
  beforeEach(() => {
    jest.clearAllMocks();
    
    // useSymbolStoreのモック実装
    (useSymbolStore as unknown as jest.Mock).mockReturnValue({
      setFilterOptions: jest.fn(),
      clearFilters: jest.fn(),
      filterOptions: {
        searchTerm: '',
        quoteAsset: '',
        favoritesOnly: false,
      },
    });
    
    // validateFilterOptionsのモック実装
    (validateFilterOptions as jest.Mock).mockReturnValue({
      success: true,
    });
    
    // console.warnのスパイ
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  test('基本的な初期化', () => {
    const { result } = renderHook(() => useFilterState());
    
    // フックが正しく初期化されていることを確認
    expect(result.current.filterOptions).toEqual({
      searchTerm: '',
      quoteAsset: '',
      favoritesOnly: false,
    });
    
    // コモン基軸通貨が正しいことを確認
    expect(result.current.commonQuoteAssets).toEqual(['USDT', 'USD', 'BTC', 'ETH']);
  });
  
  test('検索処理が正しく動作する', () => {
    const mockSetFilterOptions = jest.fn();
    (useSymbolStore as unknown as jest.Mock).mockReturnValue({
      setFilterOptions: mockSetFilterOptions,
      clearFilters: jest.fn(),
      filterOptions: {
        searchTerm: '',
        quoteAsset: '',
        favoritesOnly: false,
      },
    });
    
    const { result } = renderHook(() => useFilterState());
    
    // 検索処理を実行
    act(() => {
      result.current.handleSearch('BTC');
    });
    
    // setFilterOptionsが正しい引数で呼ばれていることを確認
    expect(mockSetFilterOptions).toHaveBeenCalledWith({ searchTerm: 'BTC' });
  });
  
  test('基軸通貨フィルターが正しく動作する', () => {
    const mockSetFilterOptions = jest.fn();
    (useSymbolStore as unknown as jest.Mock).mockReturnValue({
      setFilterOptions: mockSetFilterOptions,
      clearFilters: jest.fn(),
      filterOptions: {
        searchTerm: '',
        quoteAsset: '',
        favoritesOnly: false,
      },
    });
    
    const { result } = renderHook(() => useFilterState());
    
    // 基軸通貨フィルターを実行
    act(() => {
      result.current.handleQuoteAssetFilter('USDT');
    });
    
    // setFilterOptionsが正しい引数で呼ばれていることを確認
    expect(mockSetFilterOptions).toHaveBeenCalledWith({ quoteAsset: 'USDT' });
  });
  
  test('お気に入りトグルが正しく動作する', () => {
    const mockSetFilterOptions = jest.fn();
    (useSymbolStore as unknown as jest.Mock).mockReturnValue({
      setFilterOptions: mockSetFilterOptions,
      clearFilters: jest.fn(),
      filterOptions: {
        searchTerm: '',
        quoteAsset: '',
        favoritesOnly: false,
      },
    });
    
    const { result } = renderHook(() => useFilterState());
    
    // お気に入りトグルを実行
    act(() => {
      result.current.handleFavoritesToggle();
    });
    
    // setFilterOptionsが正しい引数で呼ばれていることを確認
    expect(mockSetFilterOptions).toHaveBeenCalledWith({ favoritesOnly: true });
  });
  
  test('フィルターリセットが正しく動作する', () => {
    const mockClearFilters = jest.fn();
    (useSymbolStore as unknown as jest.Mock).mockReturnValue({
      setFilterOptions: jest.fn(),
      clearFilters: mockClearFilters,
      filterOptions: {
        searchTerm: 'BTC',
        quoteAsset: 'USDT',
        favoritesOnly: true,
      },
    });
    
    const { result } = renderHook(() => useFilterState());
    
    // フィルターリセットを実行
    act(() => {
      result.current.resetFilters();
    });
    
    // clearFiltersが呼ばれていることを確認
    expect(mockClearFilters).toHaveBeenCalled();
  });
  
  test('無効なフィルターオプションで警告が表示される', () => {
    // validateFilterOptionsのモック実装を変更
    (validateFilterOptions as jest.Mock).mockReturnValue({
      success: false,
      error: 'Invalid filter options',
    });
    
    renderHook(() => useFilterState());
    
    // console.warnが呼ばれていることを確認
    expect(console.warn).toHaveBeenCalledWith(
      'Filter options validation failed:',
      'Invalid filter options'
    );
  });
}); 