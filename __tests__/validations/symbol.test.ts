// __tests__/validations/symbol.test.ts
// 作成: シンボルバリデーションのテスト
// 更新: T-7.3フェーズ - インポートパスを types/validations に変更、ExchangeProductType参照を更新

import {
  validateSymbolInfo,
  validateFilterOptions,
  validateSymbolSelectorProps,
  symbolInfoSchema,
  filterOptionsSchema,
  symbolSelectorPropsSchema
} from '@/types/validations/symbol';
import { ExchangeProductType } from '@/types/constants/enums';

describe('Symbol Validations', () => {
  describe('symbolInfoSchema', () => {
    it('有効なシンボル情報を検証できる', () => {
      const validSymbol = {
        symbol: 'BTCUSDT',
        baseAsset: 'BTC',
        quoteCoin: 'USDT',
        pricePrecision: 2,
        quantityPrecision: 6,
        minNotional: '10',
        status: 'TRADING',
        favorite: true
      };

      const result = symbolInfoSchema.safeParse(validSymbol);
      expect(result.success).toBe(true);
    });

    it('無効なシンボル情報を検出できる', () => {
      const invalidSymbol = {
        symbol: '', // 空文字列は無効
        baseAsset: 'BTC',
        quoteCoin: 'USDT',
        pricePrecision: 2,
        quantityPrecision: 6,
        minNotional: '10',
        status: 'TRADING'
      };

      const result = symbolInfoSchema.safeParse(invalidSymbol);
      expect(result.success).toBe(false);
    });

    it('validateSymbolInfo関数が正しく動作する', () => {
      const validSymbol = {
        symbol: 'BTCUSDT',
        baseAsset: 'BTC',
        quoteCoin: 'USDT',
        pricePrecision: 2,
        quantityPrecision: 6,
        minNotional: '10',
        status: 'TRADING'
      };

      const result = validateSymbolInfo(validSymbol);
      expect(result.success).toBe(true);
    });
  });

  describe('filterOptionsSchema', () => {
    it('有効なフィルターオプションを検証できる', () => {
      const validOptions = {
        searchTerm: 'BTC',
        quoteCoin: 'USDT',
        favoritesOnly: true
      };

      const result = filterOptionsSchema.safeParse(validOptions);
      expect(result.success).toBe(true);
    });

    it('空のオブジェクトをデフォルト値で検証できる', () => {
      const emptyOptions = {};

      const result = filterOptionsSchema.safeParse(emptyOptions);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.searchTerm).toBe('');
        expect(result.data.quoteCoin).toBe('');
        expect(result.data.favoritesOnly).toBe(false);
      }
    });

    it('validateFilterOptions関数が正しく動作する', () => {
      const validOptions = {
        searchTerm: 'BTC',
        quoteCoin: 'USDT',
        favoritesOnly: true
      };

      const result = validateFilterOptions(validOptions);
      expect(result.success).toBe(true);
    });
  });

  describe('symbolSelectorPropsSchema', () => {
    it('有効なプロパティを検証できる', () => {
      const validProps = {
        onSelect: (symbol: string) => {},
        currentSymbol: 'BTCUSDT',
        defaultExchangeType: 'spot' as ExchangeProductType,
        onExchangeTypeChange: (type: ExchangeProductType) => {}
      };

      const result = symbolSelectorPropsSchema.safeParse(validProps);
      expect(result.success).toBe(true);
    });

    it('必須プロパティが欠けている場合にエラーを検出できる', () => {
      const invalidProps = {
        // onSelectが欠けている
        currentSymbol: 'BTCUSDT',
        defaultExchangeType: 'spot' as ExchangeProductType
      };

      const result = symbolSelectorPropsSchema.safeParse(invalidProps);
      expect(result.success).toBe(false);
    });

    it('validateSymbolSelectorProps関数が正しく動作する', () => {
      const validProps = {
        onSelect: (symbol: string) => {},
        currentSymbol: 'BTCUSDT',
        defaultExchangeType: 'spot' as ExchangeProductType
      };

      const result = validateSymbolSelectorProps(validProps);
      expect(result.success).toBe(true);
    });
  });
});