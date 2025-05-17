/**
 * __tests__/hooks/symbol/usePopularSymbols.test.ts
 * usePopularSymbolsフックのテストスイート
 */

import { renderHook } from '@testing-library/react';
import { usePopularSymbols, POPULAR_SYMBOLS } from '@/hooks/symbol';
import type { FilterOptions, SymbolInfo } from '@/store/useSymbolStore';

// モックシンボルデータ
const mockSymbols: SymbolInfo[] = [
  { symbol: 'BTCUSDT', baseCoin: 'BTC', quoteCoin: 'USDT', favorite: false },
  { symbol: 'ETHUSDT', baseCoin: 'ETH', quoteCoin: 'USDT', favorite: true },
  { symbol: 'BNBBTC', baseCoin: 'BNB', quoteCoin: 'BTC', favorite: false },
  { symbol: 'SOLUSDT', baseCoin: 'SOL', quoteCoin: 'USDT', favorite: false },
  { symbol: 'MATICUSDT', baseCoin: 'MATIC', quoteCoin: 'USDT', favorite: false },
];

// デフォルトフィルターオプション
const defaultFilters: FilterOptions = {
  searchTerm: '',
  quoteCoin: '',
  favoritesOnly: false,
};

describe('usePopularSymbols', () => {
  test('フィルターが適用されていない場合、人気銘柄を返す', () => {
    const { result } = renderHook(() => 
      usePopularSymbols({
        symbols: mockSymbols,
        filterOptions: defaultFilters,
      })
    );
    
    // 人気銘柄リストに含まれているシンボルだけが返されていることを確認
    expect(result.current).toHaveLength(4); // BTCUSDT, ETHUSDT, SOLUSDT, MATICUSDT
    expect(result.current.map(s => s.symbol)).toEqual(
      expect.arrayContaining(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'MATICUSDT'].filter(s => 
        mockSymbols.some(ms => ms.symbol === s)
      ))
    );
  });
  
  test('searchTermが適用されている場合、空配列を返す', () => {
    const { result } = renderHook(() => 
      usePopularSymbols({
        symbols: mockSymbols,
        filterOptions: {
          ...defaultFilters,
          searchTerm: 'BTC',
        },
      })
    );
    
    // 検索フィルターが適用されていると空配列が返されることを確認
    expect(result.current).toHaveLength(0);
  });
  
  test('quoteCoinが適用されている場合、空配列を返す', () => {
    const { result } = renderHook(() => 
      usePopularSymbols({
        symbols: mockSymbols,
        filterOptions: {
          ...defaultFilters,
          quoteCoin: 'USDT',
        },
      })
    );
    
    // 基軸通貨フィルターが適用されていると空配列が返されることを確認
    expect(result.current).toHaveLength(0);
  });
  
  test('favoritesOnlyが適用されている場合、空配列を返す', () => {
    const { result } = renderHook(() => 
      usePopularSymbols({
        symbols: mockSymbols,
        filterOptions: {
          ...defaultFilters,
          favoritesOnly: true,
        },
      })
    );
    
    // お気に入りフィルターが適用されていると空配列が返されることを確認
    expect(result.current).toHaveLength(0);
  });
  
  test('シンボルリストがPOPULAR_SYMBOLSに含まれない場合、空配列を返す', () => {
    // POPULAR_SYMBOLSに含まれないシンボルのみのリスト
    const nonPopularSymbols: SymbolInfo[] = [
      { symbol: 'XRPBTC', baseCoin: 'XRP', quoteCoin: 'BTC', favorite: false },
      { symbol: 'LRCETH', baseCoin: 'LRC', quoteCoin: 'ETH', favorite: false },
    ];
    
    const { result } = renderHook(() => 
      usePopularSymbols({
        symbols: nonPopularSymbols,
        filterOptions: defaultFilters,
      })
    );
    
    // POPULAR_SYMBOLSに含まれないシンボルは返されないことを確認
    expect(result.current).toHaveLength(0);
  });
}); 