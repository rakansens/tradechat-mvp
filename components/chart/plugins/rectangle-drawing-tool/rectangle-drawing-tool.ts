// components/chart/plugins/rectangle-drawing-tool/rectangle-drawing-tool.ts
// 更新: 不足しているモジュールの実装と型エラーの修正

import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
        Coordinate,
        IChartApi,
        isBusinessDay,
        ISeriesApi,
        ISeriesPrimitiveAxisView,
        IPrimitivePaneRenderer,
        IPrimitivePaneView,
        MouseEventParams,
        PrimitivePaneViewZOrder,
        SeriesType,
        Time,
} from 'lightweight-charts';

// 不足しているモジュールの代替実装
// assertions.ts の代替実装
function ensureDefined<T>(value: T | undefined): T {
    if (value === undefined) {
        throw new Error('Value is undefined');
    }
    return value;
}

// plugin-base.ts の代替実装
abstract class PluginBase {
    protected _chart: IChartApi;

    constructor(chart: IChartApi) {
        this._chart = chart;
    }

    public abstract destroy(): void;
}

// positions.ts の代替実装
interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

function positionsBox(x1: number, y1: number, x2: number, y2: number): Box {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    
    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
}

// 以下は既存のコード