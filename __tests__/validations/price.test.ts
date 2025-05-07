// __tests__/validations/price.test.ts
// 作成: 価格バリデーションスキーマのテスト

import { 
  priceDisplaySchema, 
  priceChangeSchema,
  validatePriceDisplay,
  validatePriceChange
} from '../../lib/validations/price';

describe('価格バリデーションスキーマのテスト', () => {
  describe('priceDisplaySchema', () => {
    test('有効なデータを検証できる', () => {
      const validData = {
        price: 12345.67,
        symbol: 'BTC-USDT',
        showSymbol: true,
        className: 'custom-class',
        size: 'md' as const
      };
      
      const result = priceDisplaySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('必須フィールドのみでも検証できる', () => {
      const minimalData = {
        price: 12345.67
      };
      
      const result = priceDisplaySchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        // デフォルト値が正しく設定されているか確認
        expect(result.data.showSymbol).toBe(false);
        expect(result.data.className).toBe('');
        expect(result.data.size).toBe('md');
      }
    });

    test('無効なデータを検出できる', () => {
      const invalidData = {
        price: 'not-a-number',
        size: 'invalid-size'
      };
      
      const result = priceDisplaySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('validatePriceDisplay関数が正しく動作する', () => {
      const validData = { price: 12345.67 };
      const result = validatePriceDisplay(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('priceChangeSchema', () => {
    test('有効なデータを検証できる', () => {
      const validData = {
        changePercent: 5.25,
        className: 'custom-class',
        size: 'lg' as const,
        showPlusSign: true
      };
      
      const result = priceChangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('必須フィールドのみでも検証できる', () => {
      const minimalData = {
        changePercent: -3.75
      };
      
      const result = priceChangeSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        // デフォルト値が正しく設定されているか確認
        expect(result.data.className).toBe('');
        expect(result.data.size).toBe('md');
        expect(result.data.showPlusSign).toBe(true);
      }
    });

    test('無効なデータを検出できる', () => {
      const invalidData = {
        changePercent: 'not-a-number',
        size: 'invalid-size'
      };
      
      const result = priceChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('validatePriceChange関数が正しく動作する', () => {
      const validData = { changePercent: -3.75 };
      const result = validatePriceChange(validData);
      expect(result.success).toBe(true);
    });
  });
});