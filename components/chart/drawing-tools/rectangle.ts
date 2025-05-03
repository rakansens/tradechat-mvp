// components/chart/drawing-tools/rectangle.ts
// 作成: 四角形描画ツール

import { 
  IChartApi, 
  ISeriesApi, 
  Time 
} from 'lightweight-charts';

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

  // 四角形を描画
  chart.createCustomSeries({
    id,
    renderer: (target, series, model) => {
      const ctx = target.getContext('2d');
      if (!ctx) return;

      // 座標変換
      const x1 = model.timeScale.timeToCoordinate(topLeft.time);
      const y1 = model.priceScale.priceToCoordinate(topLeft.price, series.priceScale);
      const x2 = model.timeScale.timeToCoordinate(bottomRight.time);
      const y2 = model.priceScale.priceToCoordinate(bottomRight.price, series.priceScale);

      if (x1 === null || y1 === null || x2 === null || y2 === null) {
        return;
      }

      // 四角形の左上と右下を確定（どちらの点が左上か右下かは描画方向による）
      const left = Math.min(x1, x2);
      const top = Math.min(y1, y2);
      const width = Math.abs(x2 - x1);
      const height = Math.abs(y2 - y1);

      // 塗りつぶし
      if (defaultOptions.fillColor) {
        ctx.fillStyle = defaultOptions.fillColor;
        ctx.fillRect(left, top, width, height);
      }

      // 枠線
      if (defaultOptions.borderColor && defaultOptions.borderWidth) {
        ctx.strokeStyle = defaultOptions.borderColor;
        ctx.lineWidth = defaultOptions.borderWidth;
        
        // 線のスタイル設定
        if (defaultOptions.borderStyle === 1) { // dashed
          ctx.setLineDash([4, 2]);
        } else if (defaultOptions.borderStyle === 2) { // dotted
          ctx.setLineDash([2, 2]);
        } else {
          ctx.setLineDash([]);
        }
        
        ctx.strokeRect(left, top, width, height);
      }
    }
  });

  return {
    topLeft,
    bottomRight,
    options: defaultOptions,
    id
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
  if (!chart || !rectangle) return;

  chart.removeCustomSeries(rectangle.id);
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
      chart.unsubscribeMouseMove(handleMouseMove);
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
    chart.unsubscribeMouseMove(handleMouseMove);
    isDrawing = false;
    startPoint = null;
  };

  // 描画ツールを開始
  const start = () => {
    // 既存のイベントリスナーをクリーンアップ
    cancel();
    
    // 新しいイベントリスナーを設定
    chart.subscribeClick(handleClick);
    chart.subscribeMouseMove(handleMouseMove);
  };

  return {
    start,
    cancel
  };
} 