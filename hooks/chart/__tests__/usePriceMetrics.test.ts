// hooks/chart/__tests__/usePriceMetrics.test.ts
// 作成: usePriceMetricsフックのテスト
// 役割:
// 1. 現在価格計算ロジックの検証
// 2. 価格変化率計算ロジックの検証
// 3. エッジケース（データなし、1件のみ）の処理検証

import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { usePriceMetrics } from '../usePriceMetrics';
import { OHLCData } from '@/types/chart';

describe('usePriceMetrics', () => {
  // テスト用データ
  const mockChartData: OHLCData[] = [
    { time: 1000, open: 45000, high: 46000, low: 44000, close: 45500, volume: 100 },
    { time: 2000, open: 45500, high: 47000, low: 45000, close: 46500, volume: 150 },
    { time: 3000, open: 46500, high: 48000, low: 46000, close: 47500, volume: 200 }
  ];

  it('チャートデータから現在価格を正しく計算する', () => {
    const { result } = renderHook(() => usePriceMetrics(mockChartData));
    
    // 最後のローソク足の終値が現在価格として返される
    expect(result.current.currentPrice).toBe(47500);
  });

  it('チャートデータから価格変化率を正しく計算する', () => {
    const { result } = renderHook(() => usePriceMetrics(mockChartData));
    
    // 最初のローソク足の始値と最後のローソク足の終値から変化率を計算
    // (47500 - 45000) / 45000 * 100 = 5.56%
    expect(result.current.priceChangePercent).toBeCloseTo(5.56, 2);
  });

  it('データがない場合は0を返す', () => {
    const { result } = renderHook(() => usePriceMetrics(null));
    
    expect(result.current.currentPrice).toBe(0);
    expect(result.current.priceChangePercent).toBe(0);
  });

  it('データが1件だけの場合は価格変化率を0とする', () => {
    const singleData: OHLCData[] = [
      { time: 1000, open: 45000, high: 46000, low: 44000, close: 45500, volume: 100 }
    ];
    
    const { result } = renderHook(() => usePriceMetrics(singleData));
    
    expect(result.current.currentPrice).toBe(45500);
    expect(result.current.priceChangePercent).toBe(0);
  });

  it('メモ化された値が返される（再レンダリング時に同じデータで計算が実行されない）', () => {
    const calcSpy = jest.spyOn(React, 'useMemo');
    
    const { rerender } = renderHook(() => usePriceMetrics(mockChartData));
    expect(calcSpy).toHaveBeenCalledTimes(2); // 現在価格と変化率で2回
    
    // 同じデータで再レンダリング
    calcSpy.mockClear();
    rerender();
    
    // 新しく計算は行われない（useMemoが新たに実行されない）
    expect(calcSpy).toHaveBeenCalledTimes(0);
  });
}); 