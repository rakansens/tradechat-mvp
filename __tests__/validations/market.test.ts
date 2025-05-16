// __tests__/validations/market.test.ts
// 作成: 市場データバリデーションのテスト
// 更新: T-7.3フェーズ - インポートパスを types/validations に変更

import {
  validateOrderBookEntry,
  validateOrderBookData,
  validateOrderBookProps,
  validateTradeData,
  validateMarketStatsData,
  validateSymbolInfo,
  orderBookEntrySchema,
  orderBookDataSchema,
  orderBookPropsSchema,
  tradeDataSchema,
  marketStatsDataSchema,
  symbolInfoSchema
} from '@/types/validations/market';

describe('Market Validations', () => {
  describe('orderBookEntrySchema', () => {
    it('有効なオーダーブックエントリーを検証できる', () => {
      const validEntry = {
        price: 50000,
        amount: 1.5,
        total: 75000
      };

      const result = orderBookEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });

    it('totalが省略可能である', () => {
      const validEntry = {
        price: 50000,
        amount: 1.5
      };

      const result = orderBookEntrySchema.safeParse(validEntry);
      expect(result.success).toBe(true);
    });

    it('負の値を検出できる', () => {
      const invalidEntry = {
        price: -50000, // 負の値は無効
        amount: 1.5,
        total: 75000
      };

      const result = orderBookEntrySchema.safeParse(invalidEntry);
      expect(result.success).toBe(false);
    });

    it('validateOrderBookEntry関数が正しく動作する', () => {
      const validEntry = {
        price: 50000,
        amount: 1.5
      };

      const result = validateOrderBookEntry(validEntry);
      expect(result.success).toBe(true);
    });
  });

  describe('orderBookDataSchema', () => {
    it('有効なオーダーブックデータを検証できる', () => {
      const validData = {
        symbol: 'BTCUSDT',
        timestamp: 1620000000000,
        bids: [
          { price: 49000, amount: 1.2 },
          { price: 48900, amount: 0.5 }
        ],
        asks: [
          { price: 50000, amount: 0.8 },
          { price: 50100, amount: 1.5 }
        ]
      };

      const result = orderBookDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('必須フィールドが欠けている場合にエラーを検出できる', () => {
      const invalidData = {
        symbol: 'BTCUSDT',
        // timestampが欠けている
        bids: [
          { price: 49000, amount: 1.2 }
        ],
        asks: [
          { price: 50000, amount: 0.8 }
        ]
      };

      const result = orderBookDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('validateOrderBookData関数が正しく動作する', () => {
      const validData = {
        symbol: 'BTCUSDT',
        timestamp: 1620000000000,
        bids: [
          { price: 49000, amount: 1.2 }
        ],
        asks: [
          { price: 50000, amount: 0.8 }
        ]
      };

      const result = validateOrderBookData(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('orderBookPropsSchema', () => {
    it('有効なオーダーブックプロパティを検証できる', () => {
      const validProps = {
        depth: 20,
        className: 'custom-class',
        orderBookWidth: '40%'
      };

      const result = orderBookPropsSchema.safeParse(validProps);
      expect(result.success).toBe(true);
    });

    it('すべてのプロパティが省略可能である', () => {
      const emptyProps = {};

      const result = orderBookPropsSchema.safeParse(emptyProps);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.depth).toBe(15); // デフォルト値
        expect(result.data.orderBookWidth).toBe('33%'); // デフォルト値
      }
    });

    it('validateOrderBookProps関数が正しく動作する', () => {
      const validProps = {
        depth: 20,
        orderBookWidth: 400
      };

      const result = validateOrderBookProps(validProps);
      expect(result.success).toBe(true);
    });
  });

  describe('tradeDataSchema', () => {
    it('有効な取引データを検証できる', () => {
      const validTrade = {
        id: '123456',
        symbol: 'BTCUSDT',
        price: 50000,
        amount: 1.5,
        timestamp: 1620000000000,
        direction: 'buy'
      };

      const result = tradeDataSchema.safeParse(validTrade);
      expect(result.success).toBe(true);
    });

    it('無効な取引方向を検出できる', () => {
      const invalidTrade = {
        id: '123456',
        symbol: 'BTCUSDT',
        price: 50000,
        amount: 1.5,
        timestamp: 1620000000000,
        direction: 'invalid' // 'buy'または'sell'のみ有効
      };

      const result = tradeDataSchema.safeParse(invalidTrade);
      expect(result.success).toBe(false);
    });

    it('validateTradeData関数が正しく動作する', () => {
      const validTrade = {
        id: '123456',
        symbol: 'BTCUSDT',
        price: 50000,
        amount: 1.5,
        timestamp: 1620000000000,
        direction: 'sell'
      };

      const result = validateTradeData(validTrade);
      expect(result.success).toBe(true);
    });
  });

  describe('marketStatsDataSchema', () => {
    it('有効な市場統計データを検証できる', () => {
      const validStats = {
        symbol: 'BTCUSDT',
        high24h: 52000,
        low24h: 48000,
        volume24h: 1000,
        priceChangePercent24h: 2.5,
        lastPrice: 50000,
        timestamp: 1620000000000
      };

      const result = marketStatsDataSchema.safeParse(validStats);
      expect(result.success).toBe(true);
    });

    it('負の価格変化率を許容する', () => {
      const validStats = {
        symbol: 'BTCUSDT',
        high24h: 52000,
        low24h: 48000,
        volume24h: 1000,
        priceChangePercent24h: -2.5, // 負の値も有効
        lastPrice: 50000,
        timestamp: 1620000000000
      };

      const result = marketStatsDataSchema.safeParse(validStats);
      expect(result.success).toBe(true);
    });

    it('validateMarketStatsData関数が正しく動作する', () => {
      const validStats = {
        symbol: 'BTCUSDT',
        high24h: 52000,
        low24h: 48000,
        volume24h: 1000,
        priceChangePercent24h: 0,
        lastPrice: 50000,
        timestamp: 1620000000000
      };

      const result = validateMarketStatsData(validStats);
      expect(result.success).toBe(true);
    });
  });

  describe('symbolInfoSchema', () => {
    it('有効な銘柄情報を検証できる', () => {
      const validSymbol = {
        symbol: 'BTCUSDT',
        baseCoin: 'BTC', // baseAsset → baseCoin に修正
        quoteCoin: 'USDT', // quoteAsset → quoteCoin に修正
        minOrderSize: 0.001, // minNotional → minOrderSize に修正
        pricePrecision: 2,
        quantityPrecision: 6,
        status: 'TRADING',
        exchangeType: 'spot' as const
      };

      const result = symbolInfoSchema.safeParse(validSymbol);
      expect(result.success).toBe(true);
    });

    it('validateSymbolInfo関数が正しく動作する', () => {
      const validSymbol = {
        symbol: 'BTCUSDT',
        baseCoin: 'BTC', // baseAsset → baseCoin に修正
        quoteCoin: 'USDT', // quoteAsset → quoteCoin に修正
        minOrderSize: 0.001, // minNotional → minOrderSize に修正
        pricePrecision: 2,
        quantityPrecision: 6,
        status: 'TRADING',
        exchangeType: 'futures' as const
      };

      const result = validateSymbolInfo(validSymbol);
      expect(result.success).toBe(true);
    });
  });
});