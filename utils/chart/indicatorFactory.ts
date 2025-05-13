// utils/indicatorFactory.ts
// 作成: インジケーターファクトリー関数
// 
// このファイルはチャートインジケーターの作成と管理を一元化するファクトリー関数を提供します。
// 各インジケーターの実装を統一的なインターフェースで扱うことで、コードの一貫性と保守性を向上させます。

import { IChartApi } from 'lightweight-charts';
import { OHLCData } from '@/types/chart';
import { BaseIndicatorParams, ChartIndicator, IndicatorSeriesRefs, RSIParams, MACDParams, IchimokuParams, BollingerParams } from '@/types/indicators';
import { IndicatorType } from '@/types/store';
import { logger } from '@/utils/common';

// インジケーターのレジストリ
const indicatorRegistry: Record<string, ChartIndicator<any>> = {};

/**
 * インジケーターをレジストリに登録する
 * @param id インジケーターの一意識別子
 * @param indicator インジケーターの実装
 */
export function registerIndicator<T extends BaseIndicatorParams>(
  id: string,
  indicator: ChartIndicator<T>
): void {
  if (indicatorRegistry[id]) {
    logger.warn(`Indicator with id "${id}" is already registered. Overwriting.`, {
      component: 'indicatorFactory',
      action: 'registerIndicator',
      id
    });
  }
  indicatorRegistry[id] = indicator;
}

/**
 * 登録済みのインジケーターを取得する
 * @param id インジケーターの一意識別子
 * @returns インジケーターの実装、または未登録の場合はundefined
 */
export function getIndicator<T extends BaseIndicatorParams>(
  id: string
): ChartIndicator<T> | undefined {
  return indicatorRegistry[id] as ChartIndicator<T> | undefined;
}

/**
 * インジケーターファクトリー関数
 * 計算、追加/更新、削除の関数を受け取り、ChartIndicatorインターフェースを実装したオブジェクトを返す
 * 
 * @param calculate インジケーター値を計算する関数
 * @param addOrUpdate インジケーターをチャートに追加または更新する関数
 * @param remove インジケーターをチャートから削除する関数
 * @returns ChartIndicatorインターフェースを実装したオブジェクト
 */
export function createIndicator<T extends BaseIndicatorParams>(
  calculate: (data: OHLCData[], params: T) => any,
  addOrUpdate: (chart: IChartApi, data: any, params: T, seriesRefs: IndicatorSeriesRefs) => void,
  remove: (chart: IChartApi, seriesRefs: IndicatorSeriesRefs) => void
): ChartIndicator<T> {
  return {
    calculate,
    addOrUpdate,
    remove
  };
}

/**
 * インジケーターをチャートに追加または更新する
 * @param chart チャートインスタンス
 * @param indicatorId インジケーターID
 * @param data OHLCデータ
 * @param params インジケーターパラメータ
 * @param seriesRefs シリーズ参照オブジェクト
 */
export function addOrUpdateIndicator<T extends BaseIndicatorParams>(
  chart: IChartApi,
  indicatorId: string,
  data: OHLCData[],
  params: T,
  seriesRefs: IndicatorSeriesRefs
): void {
  const indicator = getIndicator<T>(indicatorId);
  if (!indicator) {
    logger.error(`Indicator with id "${indicatorId}" is not registered.`, null, {
      component: 'indicatorFactory',
      action: 'addOrUpdateIndicator',
      indicatorId
    });
    return;
  }

  if (!params.visible) {
    // インジケーターが非表示の場合は削除する
    removeIndicator(chart, indicatorId, seriesRefs);
    return;
  }

  // インジケーター値を計算
  const indicatorData = indicator.calculate(data, params);
  
  // インジケーターをチャートに追加または更新
  indicator.addOrUpdate(chart, indicatorData, params, seriesRefs);
}

/**
 * インジケーターをチャートから削除する
 * @param chart チャートインスタンス
 * @param indicatorId インジケーターID
 * @param seriesRefs シリーズ参照オブジェクト
 */
export function removeIndicator(
  chart: IChartApi,
  indicatorId: string,
  seriesRefs: IndicatorSeriesRefs
): void {
  const indicator = getIndicator(indicatorId);
  if (!indicator) {
    logger.error(`Indicator with id "${indicatorId}" is not registered.`, null, {
      component: 'indicatorFactory',
      action: 'removeIndicator',
      indicatorId
    });
    return;
  }

  // インジケーターをチャートから削除
  indicator.remove(chart, seriesRefs);
}

/**
 * インジケータータイプに基づいてデフォルトパラメーターを取得する
 * @param indicatorType インジケータータイプ
 * @returns デフォルトパラメーター
 */
export function getDefaultIndicatorParams(indicatorType: IndicatorType): Record<string, any> {
  switch (indicatorType) {
    case 'rsi':
      return {
        period: 14,
        overbought: 70,
        oversold: 30,
        paneIndex: 1,
        visible: true
      } as RSIParams;
    
    case 'macd':
      return {
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        paneIndex: 1,
        visible: true
      } as MACDParams;
    
    case 'ichimoku':
      return {
        tenkanPeriod: 9,
        kijunPeriod: 26,
        senkouSpanBPeriod: 52,
        displacement: 26,
        paneIndex: 0,
        visible: true
      } as IchimokuParams;
    
    case 'bollinger':
      return {
        period: 20,
        stdDev: 2,
        paneIndex: 0,
        visible: true
      } as BollingerParams;
    
    case 'ema':
      return {
        period: 20,
        paneIndex: 0,
        visible: true
      };
    
    default:
      logger.warn(`Unknown indicator type: ${indicatorType}, returning empty params`, {
        component: 'indicatorFactory',
        action: 'getDefaultIndicatorParams',
        indicatorType
      });
      return { visible: true };
  }
}
