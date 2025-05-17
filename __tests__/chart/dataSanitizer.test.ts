/**
 * __tests__/chart/dataSanitizer.test.ts
 * チャートデータのサニタイジング機能のテスト
 */

import {
  normalizeTimeValue,
  ensureMilliseconds,
  removeDuplicateTimeEntries
} from '../../utils/chart/transformers';

import {
  validateTimeOrder,
  sanitizeOHLCData,
  generateDefaultChartData
} from '../../utils/chart/sanitizers';

import { OHLCData } from '@/types/chart';
import { jest } from '@jest/globals';

// loggerをモック
jest.mock('../../utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  }
}));

describe('ChartData Sanitizing Utils', () => {
  
  describe('normalizeTimeValue', () => {
    const realDateNow = Date.now;
    
    beforeEach(() => {
      // Date.nowをモック
      global.Date.now = jest.fn(() => 1609459200000); // 2021-01-01
    });
    
    afterEach(() => {
      // モックを元に戻す
      global.Date.now = realDateNow;
    });
    
    test('有効な数値の時間値をそのまま返す', () => {
      expect(normalizeTimeValue(1609459200000)).toBe(1609459200000);
    });
    
    test('文字列の日付を数値に変換', () => {
      expect(normalizeTimeValue('2021-01-01T00:00:00Z')).toBe(1609459200000);
    });
    
    test('無効な時間値の場合は現在時刻を返す', () => {
      expect(normalizeTimeValue(null)).toBe(1609459200000);
      expect(normalizeTimeValue(undefined)).toBe(1609459200000);
      expect(normalizeTimeValue(-1)).toBe(1609459200000);
      expect(normalizeTimeValue(0)).toBe(1609459200000);
      expect(normalizeTimeValue('invalid')).toBe(1609459200000);
    });
  });
  
  describe('ensureMilliseconds', () => {
    test('すでにミリ秒形式の場合はそのまま返す', () => {
      expect(ensureMilliseconds(1609459200000)).toBe(1609459200000);
    });
    
    test('Unix秒を自動的にミリ秒に変換', () => {
      expect(ensureMilliseconds(1609459200)).toBe(1609459200 * 1000);
    });
    
    test('無効な時間値の場合は現在時刻を返す', () => {
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(1609459200000);
      expect(ensureMilliseconds(-1)).toBe(1609459200000);
      expect(ensureMilliseconds(0)).toBe(1609459200000);
      expect(ensureMilliseconds(NaN)).toBe(1609459200000);
      dateSpy.mockRestore();
    });
  });
  
  describe('removeDuplicateTimeEntries', () => {
    test('重複する時間のエントリを除去して一意にする', () => {
      const data: OHLCData[] = [
        { time: 1609459200000, open: 100, high: 110, low: 90, close: 105 },
        { time: 1609459200000, open: 105, high: 115, low: 95, close: 110 }, // 同じ時間
        { time: 1609459500000, open: 110, high: 120, low: 100, close: 115 },
      ];
      
      const result = removeDuplicateTimeEntries(data);
      
      expect(result.length).toBe(2);
      expect(result[0].time).toBe(1609459200000);
      expect(result[0].close).toBe(110); // 後のエントリで上書き
    });
    
    test('無効なデータを除外', () => {
      const data = [
        { time: 1609459200000, open: 100, high: 110, low: 90, close: 105 },
        null,
        undefined,
        { time: 1609459500000, open: 110, high: 120, low: 100, close: 115 },
      ] as any[];
      
      const result = removeDuplicateTimeEntries(data);
      
      expect(result.length).toBe(2);
      expect(result[0].time).toBe(1609459200000);
      expect(result[1].time).toBe(1609459500000);
    });
    
    test('Unixタイムスタンプ（秒）をミリ秒に変換', () => {
      const data: OHLCData[] = [
        { time: 1609459200, open: 100, high: 110, low: 90, close: 105 }, // 秒
        { time: 1609459500000, open: 110, high: 120, low: 100, close: 115 }, // ミリ秒
      ];
      
      const result = removeDuplicateTimeEntries(data);
      
      expect(result.length).toBe(2);
      expect(result[0].time).toBe(1609459200000); // 秒からミリ秒に変換
      expect(result[1].time).toBe(1609459500000);
    });
  });
  
  describe('validateTimeOrder', () => {
    test('時間順に並んでいるデータは有効と判定', () => {
      const data = [
        { time: 1609459200000 },
        { time: 1609459300000 },
        { time: 1609459400000 },
      ];
      
      expect(validateTimeOrder(data)).toBe(true);
    });
    
    test('時間順でない、または同じ時間のデータがある場合は無効と判定', () => {
      const outOfOrderData = [
        { time: 1609459200000 },
        { time: 1609459400000 },
        { time: 1609459300000 }, // 順序が逆
      ];
      
      const duplicateTimeData = [
        { time: 1609459200000 },
        { time: 1609459300000 },
        { time: 1609459300000 }, // 同じ時間
      ];
      
      expect(validateTimeOrder(outOfOrderData)).toBe(false);
      expect(validateTimeOrder(duplicateTimeData)).toBe(false);
    });
    
    test('データが1件以下の場合は常に有効と判定', () => {
      expect(validateTimeOrder([])).toBe(true);
      expect(validateTimeOrder([{ time: 1609459200000 }])).toBe(true);
    });
  });
  
  describe('sanitizeOHLCData', () => {
    test('有効なデータを正規化して返す', () => {
      const data: OHLCData[] = [
        { time: 1609459200, open: 100, high: 110, low: 90, close: 105 },
        { time: 1609459500, open: 110, high: 120, low: 100, close: 115 },
      ];
      
      const result = sanitizeOHLCData(data);
      
      expect(result.length).toBe(2);
      expect(result[0].time).toBe(1609459200000); // 秒からミリ秒に変換
      expect(result[0].open).toBe(100); // 数値変換
      expect(result[1].time).toBe(1609459500000);
      expect(result[1].open).toBe(110);
    });
    
    test('無効なデータを除外', () => {
      const data: any[] = [
        { time: 0, open: 100, high: 110, low: 90, close: 105 }, // 無効な時間
        { time: 1609459200, open: NaN, high: 110, low: 90, close: 105 }, // 無効な価格
        { time: 1609459500, open: 110, high: 120, low: 100, close: 115 }, // 有効
      ];
      
      const result = sanitizeOHLCData(data);
      
      expect(result.length).toBe(1);
      expect(result[0].time).toBe(1609459500000);
    });
    
    test('空のデータまたはnullの場合は空配列を返す', () => {
      expect(sanitizeOHLCData([])).toEqual([]);
      expect(sanitizeOHLCData(null as any)).toEqual([]);
    });
  });
  
  describe('generateDefaultChartData', () => {
    let randomSpy: any; // SpyInstanceをanyに置換
    
    beforeEach(() => {
      // Math.randomをモックして固定値を返すようにする
      randomSpy = jest.spyOn(Math, 'random').mockImplementation(() => 0.5);
    });
    
    afterEach(() => {
      // モックを元に戻す
      randomSpy.mockRestore();
    });
    
    test('24時間分のデータを生成', () => {
      const result = generateDefaultChartData();
      
      expect(result.length).toBe(25); // 0～24時間の25ポイント
      
      // 時間順に並んでいることを確認
      for (let i = 1; i < result.length; i++) {
        expect(result[i].time).toBeGreaterThan(result[i-1].time);
      }
      
      // データ形式を確認
      result.forEach((item: OHLCData) => {
        expect(typeof item.time).toBe('number');
        expect(typeof item.open).toBe('number');
        expect(typeof item.high).toBe('number');
        expect(typeof item.low).toBe('number');
        expect(typeof item.close).toBe('number');
        
        // 高値・安値の整合性 (Math.randomが0.5に固定されているため問題ない)
        expect(item.high).toBeGreaterThanOrEqual(item.open);
        expect(item.high).toBeGreaterThanOrEqual(item.close);
        expect(item.low).toBeLessThanOrEqual(item.open);
        expect(item.low).toBeLessThanOrEqual(item.close);
      });
    });
  });
}); 