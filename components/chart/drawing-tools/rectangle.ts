// components/chart/drawing-tools/rectangle.ts
// 更新: 四角形描画ツールの型エラー修正

import {
  IChartApi,
  ISeriesApi,
  Time,
  SeriesType,
  LineStyle,
  LineWidth
} from 'lightweight-charts';
import { registerDrawingTool } from '../plugins/drawingToolRegistry';
import type { DrawingToolPlugin } from '../plugins/types';

/**
 * 四角形の角を表すポイント
 */
interface Point {
  time: Time;
  price: number;
}

/**
 * 四角形のオプション
 */
export interface RectangleOptions {
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: number; // 0: solid, 1: dashed, 2: dotted
  fillColor?: string;
  fillOpacity?: number;
}

/**
 * 四角形オブジェクト
 */
export interface Rectangle {
  topLeft: Point;
  bottomRight: Point;
  options: RectangleOptions;
  id: string;
  series?: ISeriesApi<any>;
}

/**
 * 四角形を描画する
 * @param chart チャートインスタンス
 * @param topLeft 左上の点
 * @param bottomRight 右下の点
 * @param options 四角形のオプション
 * @returns 描画された四角形オブジェクト
 */
export function drawRectangle(
  chart: IChartApi,
  topLeft: Point,
  bottomRight: Point,
  options: RectangleOptions = {}
): Rectangle {
  if (!chart || !topLeft || !bottomRight) {
    throw new Error('Chart and points must be provided');
  }

  // デフォルトオプション
  const defaultOptions: RectangleOptions = {
    borderColor: options.borderColor || 'rgba(76, 175, 80, 1)',
    borderWidth: options.borderWidth !== undefined ? options.borderWidth : 1,
    borderStyle: options.borderStyle || 0, // 0: solid
    fillColor: options.fillColor || 'rgba(76, 175, 80, 0.1)',
    fillOpacity: options.fillOpacity !== undefined ? options.fillOpacity : 0.1
  };

  // ユニークなID生成
  const id = `rectangle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 四角形を描画するためのシリーズを作成
  // 型エラーを回避するために、any型にキャストする
  const series = (chart as any).addLineSeries({
    color: defaultOptions.borderColor || 'rgba(76, 175, 80, 1)',
    lineWidth: defaultOptions.borderWidth || 1,
    lineStyle: defaultOptions.borderStyle === 1 ? 1 : // Dashed
               defaultOptions.borderStyle === 2 ? 2 : // Dotted
               0, // Solid
    lastValueVisible: false,
    priceLineVisible: false
  });

  // データポイントを追加（四角形の角）
  series.setData([
    { time: topLeft.time, value: topLeft.price },
    { time: bottomRight.time, value: bottomRight.price }
  ]);

  return {
    topLeft,
    bottomRight,
    options: defaultOptions,
    id,
    series
  };
}

/**
 * 四角形を削除する
 * @param chart チャートインスタンス
 * @param rectangle 四角形オブジェクト
 */
export function removeRectangle(
  chart: IChartApi,
  rectangle: Rectangle
): void {
  if (!chart || !rectangle || !rectangle.series) return;

  chart.removeSeries(rectangle.series);
}

/**
 * 四角形描画ツールを作成する
 * @param chart チャートインスタンス
 * @param series 価格シリーズ
 * @param options 四角形のオプション
 * @param onComplete 描画完了時のコールバック
 * @returns 描画ツールのコントロール関数
 */
export function createRectangleDrawingTool(
  chart: IChartApi,
  series: ISeriesApi<any>,
  options?: RectangleOptions,
  onComplete?: (rect: Rectangle) => void
): { start: () => void; cancel: () => void } {
  if (!chart || !series) {
    throw new Error('Chart and series must be provided');
  }

  let isDrawing = false;
  let startPoint: Point | null = null;
  let currentRect: Rectangle | null = null;

  // マウスクリックイベントハンドラ
  const handleClick = (param: any) => {
    if (!param.time || param.seriesPrices === undefined) return;

    const price = param.seriesPrices.get(series) as number;
    if (price === undefined) return;

    if (!isDrawing) {
      // 描画開始
      isDrawing = true;
      startPoint = { time: param.time, price };
    } else {
      // 描画完了
      isDrawing = false;
      
      if (startPoint) {
        const endPoint = { time: param.time, price };
        
        // 既存の四角形を削除
        if (currentRect) {
          removeRectangle(chart, currentRect);
        }
        
        // 新しい四角形を描画
        currentRect = drawRectangle(chart, startPoint, endPoint, options);
        
        // 完了イベントをトリガー
        if (onComplete && currentRect) {
          onComplete(currentRect);
        }
      }
      
      // クリーンアップ
      chart.unsubscribeClick(handleClick);
      // MouseMoveイベントの解除
      try {
        (chart as any).unsubscribeMouseMove?.(handleMouseMove);
      } catch (e) {
        console.warn('Failed to unsubscribe from mouse move events', e);
      }
      startPoint = null;
    }
  };

  // マウス移動イベントハンドラ
  const handleMouseMove = (param: any) => {
    if (!isDrawing || !startPoint || !param.time || param.seriesPrices === undefined) return;

    const price = param.seriesPrices.get(series) as number;
    if (price === undefined) return;

    // 既存の四角形を削除
    if (currentRect) {
      removeRectangle(chart, currentRect);
    }

    // 新しい四角形を描画（仮）
    const currentPoint = { time: param.time, price };
    currentRect = drawRectangle(chart, startPoint, currentPoint, options);
  };

  // 描画をキャンセル
  const cancel = () => {
    if (currentRect) {
      removeRectangle(chart, currentRect);
      currentRect = null;
    }
    
    chart.unsubscribeClick(handleClick);
    // MouseMoveイベントの解除
    try {
      (chart as any).unsubscribeMouseMove?.(handleMouseMove);
    } catch (e) {
      console.warn('Failed to unsubscribe from mouse move events', e);
    }
    isDrawing = false;
    startPoint = null;
  };

  // 描画ツールを開始
  const start = () => {
    // 既存のイベントリスナーをクリーンアップ
    cancel();
    
    // 新しいイベントリスナーを設定
    chart.subscribeClick(handleClick);
    // MouseMoveイベントの登録
    try {
      (chart as any).subscribeMouseMove?.(handleMouseMove);
    } catch (e) {
      console.warn('Failed to subscribe to mouse move events', e);
    }
  };

  return {
    start,
    cancel
  };
}

const rectanglePlugin: DrawingToolPlugin<{
  topLeft: Point;
  bottomRight: Point;
  options?: RectangleOptions;
}, Rectangle> = {
  id: 'rectangle',
  draw(chart, _series, params) {
    return drawRectangle(chart, params.topLeft, params.bottomRight, params.options || {});
  },
  remove(chart) {
    // handle contains rectangle
    return; // rectangles are drawn as series and removed via removeRectangle
  },
};

registerDrawingTool(rectanglePlugin);

export { rectanglePlugin as RectanglePlugin };
