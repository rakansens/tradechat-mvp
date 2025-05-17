/**
 * __tests__/hooks/symbol/usePopularSymbols.test.ts
 * usePopularSymbolsフックのテストスイート
 */

import { renderHook } from '@testing-library/react';
import { usePopularSymbols, POPULAR_SYMBOLS } from '@/hooks/symbol';
import type { FilterOptions, SymbolInfo } from '@/types/symbol';

// モックシンボルデータ
const mockSymbols: SymbolInfo[] = [
  {
    id: '1',
    symbol: 'BTCUSDT',
    baseCoin: 'BTC',
    quoteCoin: 'USDT',
    minOrderSize: 0.0001,
    pricePrecision: 2,
    quantityPrecision: 6,
    status: 'TRADING',
    exchangeType: 'spot',
    favorite: false,
  },
  {
    id: '2',
    symbol: 'ETHUSDT',
    baseCoin: 'ETH',
    quoteCoin: 'USDT',
    minOrderSize: 0.001,
    pricePrecision: 2,
    quantityPrecision: 6,
    status: 'TRADING',
    exchangeType: 'spot',
    favorite: true,
  },
  {
    id: '3',
    symbol: 'BNBBTC',
    baseCoin: 'BNB',
    quoteCoin: 'BTC',
    minOrderSize: 0.01,
    pricePrecision: 2,
    quantityPrecision: 6,
    status: 'TRADING',
    exchangeType: 'spot',
    favorite: false,
  },
  {
    id: '4',
    symbol: 'SOLUSDT',
    baseCoin: 'SOL',
    quoteCoin: 'USDT',
    minOrderSize: 0.1,
    pricePrecision: 2,
    quantityPrecision: 6,
    status: 'TRADING',
    exchangeType: 'spot',
    favorite: false,
  },
  {
    id: '5',
    symbol: 'MATICUSDT',
    baseCoin: 'MATIC',
    quoteCoin: 'USDT',
    minOrderSize: 1,
    pricePrecision: 2,
    quantityPrecision: 6,
    status: 'TRADING',
    exchangeType: 'spot',
    favorite: false,
  },
];

// デフォルトフィルターオプション
const defaultFilters: FilterOptions = {
  search: '',
  quoteAsset: '',
  showFavoritesOnly: false,
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
  
  test('searchが適用されている場合、空配列を返す', () => {
    const { result } = renderHook(() => 
      usePopularSymbols({
        symbols: mockSymbols,
        filterOptions: {
          ...defaultFilters,
          search: 'BTC',
        },
      })
    );
    
    // 検索フィルターが適用されていると空配列が返されることを確認
    expect(result.current).toHaveLength(0);
  });
  
  test('quoteAssetが適用されている場合、空配列を返す', () => {
    const { result } = renderHook(() => 
      usePopularSymbols({
        symbols: mockSymbols,
        filterOptions: {
          ...defaultFilters,
          quoteAsset: 'USDT',
        },
      })
    );
    
    // 基軸通貨フィルターが適用されていると空配列が返されることを確認
    expect(result.current).toHaveLength(0);
  });
  
  test('showFavoritesOnlyが適用されている場合、空配列を返す', () => {
    const { result } = renderHook(() => 
      usePopularSymbols({
        symbols: mockSymbols,
        filterOptions: {
          ...defaultFilters,
          showFavoritesOnly: true,
        },
      })
    );
    
    // お気に入りフィルターが適用されていると空配列が返されることを確認
    expect(result.current).toHaveLength(0);
  });
  
  test('シンボルリストがPOPULAR_SYMBOLSに含まれない場合、空配列を返す', () => {
    // POPULAR_SYMBOLSに含まれないシンボルのみのリスト
    const nonPopularSymbols: SymbolInfo[] = [
      {
        id: '6',
        symbol: 'XRPBTC',
        baseCoin: 'XRP',
        quoteCoin: 'BTC',
        minOrderSize: 10,
        pricePrecision: 2,
        quantityPrecision: 6,
        status: 'TRADING',
        exchangeType: 'spot',
        favorite: false,
      },
      {
        id: '7',
        symbol: 'LRCETH',
        baseCoin: 'LRC',
        quoteCoin: 'ETH',
        minOrderSize: 1,
        pricePrecision: 2,
        quantityPrecision: 6,
        status: 'TRADING',
        exchangeType: 'spot',
        favorite: false,
      },
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