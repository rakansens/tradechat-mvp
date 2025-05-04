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
import { ensureDefined } from '../helpers/assertions/assertions';
import { PluginBase } from '../plugin-base';
import { positionsBox } from '../helpers/dimensions/positions';

// ... existing code ... 