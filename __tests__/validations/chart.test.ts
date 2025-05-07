// __tests__/validations/chart.test.ts
// 作成: チャートバリデーションスキーマのテスト

import { 
  ohlcDataSchema, 
  timeframeSchema,
  chartDataStateSchema,
  validateOHLCData,
  validateTimeframe,
  validateChartDataState
} from '../../lib/validations/chart';

describe('チャートバリデーションスキーマのテスト', () => {
  describe('ohlcDataSchema', () => {
    test('有効なOHLCデータを検証できる', () => {
      const validData = {
        time: 1620000000000,
        open: 50000,
        high: 51000,
        low: 49000,
        close: 50500,
        volume: 100
      };
      
      const result = ohlcDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('volumeはオプショナルである', () => {
      const dataWithoutVolume = {
        time: 1620000000000,
        open: 50000,
        high: 51000,
        low: 49000,
        close: 50500
      };
      
      const result = ohlcDataSchema.safeParse(dataWithoutVolume);
      expect(result.success).toBe(true);
    });

    test('無効なOHLCデータを検出できる', () => {
      const invalidData = {
        time: 'not-a-timestamp',
        open: 'not-a-number',
        high: 51000,
        low: 49000,
        close: 50500
      };
      
      const result = ohlcDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    test('validateOHLCData関数が正しく動作する', () => {
      const validData = {
        time: 1620000000000,
        open: 50000,
        high: 51000,
        low: 49000,
        close: 50500
      };
      
      const result = validateOHLCData(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('timeframeSchema', () => {
    test('有効なタイムフレームを検証できる', () => {
      const validTimeframes = [
        "1m", "3m", "5m", "15m", "30m", 
        "1h", "2h", "4h", "6h", "8h", "12h", 
        "1d", "3d", "1w", "1M"
      ];
      
      validTimeframes.forEach(timeframe => {
        const result = timeframeSchema.safeParse(timeframe);
        expect(result.success).toBe(true);
      });
    });

    test('無効なタイムフレームを検出できる', () => {
      const invalidTimeframes = ["2m", "10m", "2d", "2w", "2M", "invalid"];
      
      invalidTimeframes.forEach(timeframe => {
        const result = timeframeSchema.safeParse(timeframe);
        expect(result.success).toBe(false);
      });
    });

    test('validateTimeframe関数が正しく動作する', () => {
      const result = validateTimeframe("1h");
      expect(result.success).toBe(true);
    });
  });

  describe('chartDataStateSchema', () => {
    test('有効なチャートデータ状態を検証できる', () => {
      const validState = {
        data: [
          {
            time: 1620000000000,
            open: 50000,
            high: 51000,
            low: 49000,
            close: 50500,
            volume: 100
          }
        ],
        isLoading: false,
        error: null,
        currentSymbol: "BTC-USDT",
        currentTimeFrame: "1d",
        _abortController: null
      };
      
      const result = chartDataStateSchema.safeParse(validState);
      expect(result.success).toBe(true);
    });

    test('無効なチャートデータ状態を検出できる', () => {
      const invalidState = {
        data: "not-an-array",
        isLoading: "not-a-boolean",
        error: 123, // should be string or null
        currentSymbol: 123, // should be string
        currentTimeFrame: "invalid-timeframe"
      };
      
      const result = chartDataStateSchema.safeParse(invalidState);
      expect(result.success).toBe(false);
    });

    test('validateChartDataState関数が正しく動作する', () => {
      const validState = {
        data: [
          {
            time: 1620000000000,
            open: 50000,
            high: 51000,
            low: 49000,
            close: 50500
          }
        ],
        isLoading: true,
        error: null,
        currentSymbol: "ETH-USDT",
        currentTimeFrame: "4h",
        _abortController: null
      };
      
      const result = validateChartDataState(validState);
      expect(result.success).toBe(true);
    });
  });
});