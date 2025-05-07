// components/chart/indicators/__tests__/ichimoku.test.ts
// 更新: 一目均衡表インジケーターのテスト - 型エラー修正

// Jestではインポートする必要がない（グローバルで利用可能）
import type { OHLCData } from '@/types/chart';
import { calculateIchimokuData } from '../ichimoku';

describe('Ichimoku Indicator', () => {
  // テスト用のOHLCDデータを生成
  const generateTestData = (length: number): OHLCData[] => {
    const data: OHLCData[] = [];
    const baseDate = new Date('2023-01-01');
    
    for (let i = 0; i < length; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      
      // 簡易的な価格変動をシミュレート
      const basePrice = 100;
      const volatility = 10;
      const trend = i * 0.5; // 上昇トレンド
      
      const close = basePrice + trend + (Math.random() - 0.5) * volatility;
      const open = close * (0.98 + Math.random() * 0.04);
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      
      data.push({
        time: date.getTime() / 1000, // 文字列ではなく数値型のタイムスタンプに変更（秒単位）
        open,
        high,
        low,
        close
      });
    }
    
    return data;
  };

  it('should return correct Ichimoku components', () => {
    const ohlcData = generateTestData(100); // 十分なデータ量
    const result = calculateIchimokuData(ohlcData);
    
    // 一目均衡表の各コンポーネントが計算されていることを確認
    expect(result).toHaveProperty('tenkan');
    expect(result).toHaveProperty('kijun');
    expect(result).toHaveProperty('chikou');
    expect(result).toHaveProperty('senkouA');
    expect(result).toHaveProperty('senkouB');
    
    // 各コンポーネントが配列であることを確認
    expect(Array.isArray(result.tenkan)).toBe(true);
    expect(Array.isArray(result.kijun)).toBe(true);
    expect(Array.isArray(result.chikou)).toBe(true);
    expect(Array.isArray(result.senkouA)).toBe(true);
    expect(Array.isArray(result.senkouB)).toBe(true);
  });
  
  it('should handle custom periods', () => {
    const ohlcData = generateTestData(100);
    const customPeriods = {
      tenkan: 10,
      kijun: 25,
      senkou: 50,
    };
    
    const result = calculateIchimokuData(ohlcData, customPeriods);
    
    // カスタム期間で計算されたデータが存在することを確認
    expect(result.tenkan.length).toBeGreaterThan(0);
    expect(result.kijun.length).toBeGreaterThan(0);
    expect(result.senkouB.length).toBeGreaterThan(0);
  });
  
  it('should handle insufficient data', () => {
    const shortData = generateTestData(20); // センコウBの計算には52ポイント以上必要
    const result = calculateIchimokuData(shortData);
    
    // データが不足している場合、適切に処理されることを確認
    expect(result.senkouB.length).toBeLessThan(shortData.length);
  });

  it('should align data with correct time values', () => {
    const ohlcData = generateTestData(100);
    const result = calculateIchimokuData(ohlcData);
    
    // 各データポイントが適切なtimeプロパティを持っていることを確認
    for (let i = 0; i < result.tenkan.length; i++) {
      if (result.tenkan[i] && ohlcData[i]) {
        expect(result.tenkan[i].time).toBe(ohlcData[i].time);
      }
    }
  });

  it('should project Senkou Span correctly into the future', () => {
    const ohlcData = generateTestData(100);
    const result = calculateIchimokuData(ohlcData);
    
    // センコウスパンが先行して計算されていることを確認
    const kijunPeriod = 26; // デフォルト値
    
    if (result.senkouA.length > kijunPeriod) {
      // センコウAの26本先のデータポイントがohlcDataの最後のポイントと一致すること
      const lastDataIndex = ohlcData.length - 1;
      const projectedIndex = lastDataIndex - kijunPeriod;
      
      if (projectedIndex >= 0 && result.senkouA[projectedIndex]) {
        expect(result.senkouA[projectedIndex].time).toBe(ohlcData[lastDataIndex].time);
      }
    }
  });
}); 