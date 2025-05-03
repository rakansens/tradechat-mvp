// components/chart/drawing-tools/__tests__/fibonacci.test.ts
// 作成: フィボナッチリトレースメントのテスト

// Jestではインポートする必要がない（グローバルで利用可能）
import { 
  calculateFibonacciLevels, 
  type FibonacciLevel, 
  type FibonacciDirection 
} from '../fibonacci';

describe('Fibonacci Retracement Tool', () => {
  // テスト用の価格範囲
  const highPrice = 200;
  const lowPrice = 100;

  it('should calculate correct fibonacci levels for downtrend', () => {
    const direction: FibonacciDirection = 'down';
    const levels = calculateFibonacciLevels(highPrice, lowPrice, direction);
    
    // フィボナッチレベルの数が正しいことを確認（0%, 23.6%, 38.2%, 50%, 61.8%, 78.6%, 100%）
    expect(levels.length).toBe(7);
    
    // 下降トレンドの場合、100%は高値、0%は安値
    const expectedLevels: FibonacciLevel[] = [
      { level: 0, value: lowPrice, color: 'rgba(99, 102, 241, 1)', label: '0%' },
      { level: 0.236, value: lowPrice + (highPrice - lowPrice) * 0.236, color: 'rgba(236, 72, 153, 1)', label: '23.6%' },
      { level: 0.382, value: lowPrice + (highPrice - lowPrice) * 0.382, color: 'rgba(99, 102, 241, 1)', label: '38.2%' },
      { level: 0.5, value: lowPrice + (highPrice - lowPrice) * 0.5, color: 'rgba(236, 72, 153, 1)', label: '50%' },
      { level: 0.618, value: lowPrice + (highPrice - lowPrice) * 0.618, color: 'rgba(99, 102, 241, 1)', label: '61.8%' },
      { level: 0.786, value: lowPrice + (highPrice - lowPrice) * 0.786, color: 'rgba(236, 72, 153, 1)', label: '78.6%' },
      { level: 1, value: highPrice, color: 'rgba(99, 102, 241, 1)', label: '100%' },
    ];

    // 各レベルの値を確認
    for (let i = 0; i < levels.length; i++) {
      expect(levels[i].level).toBe(expectedLevels[i].level);
      expect(levels[i].value).toBeCloseTo(expectedLevels[i].value, 5);
      expect(levels[i].label).toBe(expectedLevels[i].label);
    }
  });

  it('should calculate correct fibonacci levels for uptrend', () => {
    const direction: FibonacciDirection = 'up';
    const levels = calculateFibonacciLevels(lowPrice, highPrice, direction);
    
    // フィボナッチレベルの数が正しいことを確認
    expect(levels.length).toBe(7);
    
    // 上昇トレンドの場合、0%は高値、100%は安値
    const expectedLevels: FibonacciLevel[] = [
      { level: 0, value: highPrice, color: 'rgba(99, 102, 241, 1)', label: '0%' },
      { level: 0.236, value: highPrice - (highPrice - lowPrice) * 0.236, color: 'rgba(236, 72, 153, 1)', label: '23.6%' },
      { level: 0.382, value: highPrice - (highPrice - lowPrice) * 0.382, color: 'rgba(99, 102, 241, 1)', label: '38.2%' },
      { level: 0.5, value: highPrice - (highPrice - lowPrice) * 0.5, color: 'rgba(236, 72, 153, 1)', label: '50%' },
      { level: 0.618, value: highPrice - (highPrice - lowPrice) * 0.618, color: 'rgba(99, 102, 241, 1)', label: '61.8%' },
      { level: 0.786, value: highPrice - (highPrice - lowPrice) * 0.786, color: 'rgba(236, 72, 153, 1)', label: '78.6%' },
      { level: 1, value: lowPrice, color: 'rgba(99, 102, 241, 1)', label: '100%' },
    ];

    // 各レベルの値を確認
    for (let i = 0; i < levels.length; i++) {
      expect(levels[i].level).toBe(expectedLevels[i].level);
      expect(levels[i].value).toBeCloseTo(expectedLevels[i].value, 5);
      expect(levels[i].label).toBe(expectedLevels[i].label);
    }
  });

  it('should handle negative price values correctly', () => {
    const negHighPrice = 50;
    const negLowPrice = -50;
    const direction: FibonacciDirection = 'down';
    
    const levels = calculateFibonacciLevels(negHighPrice, negLowPrice, direction);
    
    // 負の価格でも計算が正しく行われることを確認
    expect(levels[0].value).toBe(negLowPrice); // 0%
    expect(levels[levels.length - 1].value).toBe(negHighPrice); // 100%
  });
}); 