import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { OHLCData } from '@/types/chart';

export interface DrawingToolPlugin<TOptions = any, THandle = any> {
  id: string;
  draw(chart: IChartApi, series: ISeriesApi<any>, options: TOptions): THandle;
  remove(chart: IChartApi, series: ISeriesApi<any>, handle: THandle): void;
}

export interface IndicatorPlugin<TParams = any> {
  id: string;
  calculate(data: OHLCData[], params: TParams): any;
  addOrUpdate(
    chart: IChartApi,
    data: any,
    params: TParams,
    seriesRefs: Record<string, any>
  ): void;
  remove(chart: IChartApi, seriesRefs: Record<string, any>): void;
}
