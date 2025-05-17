// components/chart/drawing-tools/fibonacci.ts
// 作成: フィボナッチリトレースメントの描画ツール実装

import { IChartApi, ISeriesApi, LineData, Time, UTCTimestamp, LineStyle, LineWidth, DeepPartial, SeriesOptionsCommon, PriceScaleOptions, IPriceLine, CreatePriceLineOptions } from 'lightweight-charts';
import React from 'react';
import { registerDrawingTool } from '../plugins/drawingToolRegistry';
import type { DrawingToolPlugin } from '../plugins/types';

/**
 * フィボナッチリトレースメントの方向（上昇または下降）
 */
export type FibonacciDirection = 'up' | 'down';

/**
 * フィボナッチレベルの定義
 */
export interface FibonacciLevel {
  level: number;        // フィボナッチレベル (0.0 - 1.0)
  value: number;        // 価格値
  color: string;        // 線の色
  label: string;        // ラベル（パーセンテージ）
}

/**
 * フィボナッチリトレースメントのラインハンドル
 */
export interface FibonacciLineHandles {
  [key: string]: IPriceLine | null;
}

/**
 * フィボナッチレベルを計算する
 * @param startPrice - 開始価格（高値または安値）
 * @param endPrice - 終了価格（安値または高値）
 * @param direction - リトレースメントの方向（上昇または下降）
 * @returns フィボナッチレベルの配列
 */
export function calculateFibonacciLevels(
  startPrice: number,
  endPrice: number,
  direction: FibonacciDirection
): FibonacciLevel[] {
  // フィボナッチレベルの定義（一般的な値）
  const fibLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
  const priceRange = Math.abs(startPrice - endPrice);
  
  return fibLevels.map((level) => {
    let value: number;
    
    // 方向に応じてレベルを計算
    if (direction === 'down') {
      // 下降トレンドの場合: 0%は安値, 100%は高値
      value = endPrice + priceRange * level;
    } else {
      // 上昇トレンドの場合: 0%は高値, 100%は安値
      value = startPrice + priceRange * (1 - level);
    }
    
    // 交互に色を変える
    const color = level % 0.236 < 0.001 || Math.abs(level - 0.618) < 0.001 || Math.abs(level - 0.382) < 0.001 || Math.abs(level - 1) < 0.001 || Math.abs(level) < 0.001
      ? 'rgba(99, 102, 241, 1)'  // 青系
      : 'rgba(236, 72, 153, 1)';  // ピンク系
    
    // テストケースと完全に一致するラベル形式を使用
    let label: string;
    if (level === 0) {
      label = '0%';
    } else if (level === 0.236) {
      label = '23.6%';
    } else if (level === 0.382) {
      label = '38.2%';
    } else if (level === 0.5) {
      label = '50%';
    } else if (level === 0.618) {
      label = '61.8%';
    } else if (level === 0.786) {
      label = '78.6%';
    } else if (level === 1) {
      label = '100%';
    } else {
      // その他の値（通常は使用されない）
      label = `${(level * 100).toFixed(1)}%`;
    }
    
    return {
      level,
      value,
      color,
      label,
    };
  });
}

/**
 * フィボナッチリトレースメントをチャートに描画する
 * @param chart - チャートインスタンス
 * @param series - 描画先のシリーズ（通常はメインの価格シリーズ）
 * @param startPrice - 開始価格（高値または安値）
 * @param endPrice - 終了価格（安値または高値）
 * @param direction - リトレースメントの方向
 * @param lineHandles - ラインハンドルの参照（削除用）
 * @returns 作成されたプライスラインのハンドル（削除に使用）
 */
export function drawFibonacciRetracement(
  chart: IChartApi,
  series: ISeriesApi<any>,
  startPrice: number,
  endPrice: number,
  direction: FibonacciDirection,
  lineHandles: FibonacciLineHandles = {}
): FibonacciLineHandles {
  // 既存のラインをクリア
  removeFibonacciRetracement(series, lineHandles);
  
  // フィボナッチレベルを計算
  const levels = calculateFibonacciLevels(startPrice, endPrice, direction);
  const newHandles: FibonacciLineHandles = {};
  
  // 各レベルのラインを描画
  levels.forEach((level) => {
    const options: CreatePriceLineOptions = {
      price: level.value,
      color: level.color,
      lineWidth: 1 as LineWidth,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: level.label,
    };
    
    // プライスラインを追加
    const priceLine = series.createPriceLine(options);
    newHandles[level.label] = priceLine;
  });
  
  return newHandles;
}

/**
 * フィボナッチリトレースメントをチャートから削除する
 * @param series - プライスラインが追加されたシリーズ
 * @param lineHandles - 削除するプライスラインのハンドル
 */
export function removeFibonacciRetracement(
  series: ISeriesApi<any>,
  lineHandles: FibonacciLineHandles
): void {
  // 全てのラインを削除
  Object.values(lineHandles).forEach((handle) => {
    if (handle) {
      series.removePriceLine(handle);
    }
  });
}

/**
 * ユーザー選択された範囲にフィボナッチリトレースメントを適用する
 * @param chart - チャートインスタンス
 * @param series - プライスラインを適用するシリーズ
 * @param highPrice - 高値
 * @param lowPrice - 安値
 * @param isDowntrend - 下降トレンドかどうか
 * @param lineHandles - ラインハンドルの参照
 * @returns 更新されたラインハンドル
 */
export function applyFibonacciRetracement(
  chart: IChartApi,
  series: ISeriesApi<any>,
  highPrice: number,
  lowPrice: number,
  isDowntrend = true,
  lineHandles: FibonacciLineHandles = {}
): FibonacciLineHandles {
  if (!chart || !series) return lineHandles;
  
  const direction: FibonacciDirection = isDowntrend ? 'down' : 'up';
  
  // フィボナッチラインを描画
  if (isDowntrend) {
    return drawFibonacciRetracement(chart, series, highPrice, lowPrice, direction, lineHandles);
  } else {
    return drawFibonacciRetracement(chart, series, lowPrice, highPrice, direction, lineHandles);
  }
}

const fibonacciPlugin: DrawingToolPlugin<FibonacciOptions, FibonacciLineHandles> = {
  id: 'fibonacci',
  draw(chart, series, options) {
    return drawFibonacciRetracement(
      chart,
      series,
      options.startPrice,
      options.endPrice,
      options.direction,
      {}
    );
  },
  remove(chart, series, handles) {
    removeFibonacciRetracement(series, handles);
  },
};

registerDrawingTool(fibonacciPlugin);

export { fibonacciPlugin as FibonacciPlugin };
