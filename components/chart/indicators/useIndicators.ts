/**
 * components/chart/indicators/useIndicators.ts
 * チャートインジケーターの管理を担当するHook
 * 
 * 変更履歴:
 * - 2025-05-15: ChartCanvas.tsxから責務分離の一環として作成
 * - 2025-05-30: useIndicatorStoreをuseRootStoreとセレクターに置き換え
 */

import { useRef, useEffect, useCallback } from 'react';
import { IChartApi, ISeriesApi } from 'lightweight-charts';
import { OHLCData } from '@/types/chart';
import { logger } from '@/utils/common';
import { useRootStore } from '@/store';
import { selectActiveIndicators } from '@/store/chart/indicator/selectors';

// IndicatorTypeが文字列ユニオン型に変わったので一時的な互換インターフェースを追加
interface IndicatorWithParams {
  type: string;
  params?: any;
}
import { 
  RSI, 
  MACD, 
  MacdSeriesRefs, 
  calculateIchimokuData, 
  addOrUpdateIchimokuSeries, 
  removeIchimokuSeries 
} from './index';

// 各タイプのインジケーターシリーズ
export interface IndicatorSeriesRefs {
  // RSI
  rsiSeries: React.MutableRefObject<ISeriesApi<"Line"> | null>;
  
  // MACD
  macdSeries: React.MutableRefObject<MacdSeriesRefs>;
  
  // 一目均衡表
  tenkanSeries: React.MutableRefObject<ISeriesApi<"Line"> | null>;
  kijunSeries: React.MutableRefObject<ISeriesApi<"Line"> | null>;
  chikouSeries: React.MutableRefObject<ISeriesApi<"Line"> | null>;
  cloudSeries: React.MutableRefObject<ISeriesApi<"Area"> | null>;
}

// Pane管理用の型定義
interface PaneManagerRefs {
  paneCounter: React.MutableRefObject<number>;
  paneMap: React.MutableRefObject<Record<string, number>>;
}

// フックの戻り値の型定義
export interface UseIndicatorsReturn {
  indicatorRefs: IndicatorSeriesRefs;
  updateIndicators: (chartInstance: IChartApi, data: OHLCData[]) => void;
  clearAllIndicators: (chartInstance: IChartApi) => void;
}

/**
 * チャートインジケーター管理フック
 * - インジケーターシリーズの管理
 * - インジケーターの表示/非表示切替
 * - インジケーターデータの計算と更新
 */
export function useIndicators(): UseIndicatorsReturn {
  // インジケーターのシリーズ参照
  const rsiSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const macdSeries = useRef<MacdSeriesRefs>({ 
    macdLine: { current: null },
    signalLine: { current: null },
    histogram: { current: null }
  });
  
  // 一目均衡表のシリーズ参照
  const tenkanSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const kijunSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const chikouSeries = useRef<ISeriesApi<"Line"> | null>(null);
  const cloudSeries = useRef<ISeriesApi<"Area"> | null>(null);
  
  // Pane管理用の参照
  const paneCounterRef = useRef<number>(1); // 0はメインチャート
  const paneMapRef = useRef<Record<string, number>>({});
  
  // インジケーターストアから状態を取得
  const activeIndicators = useRootStore(selectActiveIndicators);
  
  // Paneインデックスを取得
  const getPaneIndex = useCallback((key: string): number => {
    if (paneMapRef.current[key] !== undefined) return paneMapRef.current[key];
    const idx = paneCounterRef.current++;
    paneMapRef.current[key] = idx;
    return idx;
  }, []);
  
  // インジケーターの更新
  const updateIndicators = useCallback((chartInstance: IChartApi, data: OHLCData[]) => {
    if (!chartInstance || !data || data.length === 0) return;
    
    // データを時間順にソート
    const sortedData = [...data].sort((a, b) => a.time - b.time);
    
    // RSIインジケーターの表示切替
    // IndicatorTypeを互換型にキャストして使用
    if (activeIndicators.some(indicator => (indicator as unknown as IndicatorWithParams).type === 'rsi')) {
      // RSIパラメータを取得
      const activeRSI = activeIndicators.find(indicator => (indicator as unknown as IndicatorWithParams).type === 'rsi') as unknown as IndicatorWithParams;
      const rsiParams = {
        visible: true,
        period: activeRSI?.params?.period || 14,
        overbought: activeRSI?.params?.overbought || 70,
        oversold: activeRSI?.params?.oversold || 30,
        paneIndex: getPaneIndex('rsi')
      };
      
      // 新しいRSIインターフェースを使用
      RSI.addOrUpdate(chartInstance, sortedData, rsiParams, rsiSeries);
    } else if (rsiSeries.current) {
      // RSIを非表示
      RSI.remove(chartInstance, rsiSeries);
    }
    
    // MACDインジケーターの表示切替
    // IndicatorTypeを互換型にキャストして使用
    if (activeIndicators.some(indicator => (indicator as unknown as IndicatorWithParams).type === 'macd')) {
      // MACDパラメータを取得
      const activeMacd = activeIndicators.find(indicator => (indicator as unknown as IndicatorWithParams).type === 'macd') as unknown as IndicatorWithParams;
      const macdParams = {
        fastPeriod: activeMacd?.params?.fastPeriod || 12,
        slowPeriod: activeMacd?.params?.slowPeriod || 26,
        signalPeriod: activeMacd?.params?.signalPeriod || 9,
        paneIndex: getPaneIndex('macd'),
        visible: true
      };
      
      // データが十分にあるか確認
      if (sortedData.length >= Math.max(macdParams.fastPeriod, macdParams.slowPeriod) + macdParams.signalPeriod) {
        logger.info('MACDを表示します', {
          component: 'useIndicators',
          action: 'renderMACD',
          dataPoints: sortedData.length
        });
        
        // 新しいMACDインターフェースを使用
        try {
          MACD.addOrUpdate(chartInstance, sortedData, macdParams, macdSeries.current);
        } catch (error) {
          logger.error('MACD表示中にエラーが発生しました', error, {
            component: 'useIndicators',
            action: 'renderMACD',
            params: macdParams
          });
        }
      } else {
        logger.warn('MACDの計算に必要なデータが不足しています', {
          component: 'useIndicators',
          action: 'renderMACD',
          dataPoints: sortedData.length,
          requiredPoints: Math.max(macdParams.fastPeriod, macdParams.slowPeriod) + macdParams.signalPeriod
        });
      }
    } else if (macdSeries.current.macdLine.current) {
      // MACDを非表示
      MACD.remove(chartInstance, macdSeries.current);
    }
    
    // 一目均衡表インジケーターの表示切替
    // IndicatorTypeを互換型にキャストして使用
    if (activeIndicators.some(indicator => (indicator as unknown as IndicatorWithParams).type === 'ichimoku')) {
      // 一目均衡表パラメータを取得
      const activeIchimoku = activeIndicators.find(indicator => (indicator as unknown as IndicatorWithParams).type === 'ichimoku') as unknown as IndicatorWithParams;
      
      // 一目均衡表を表示
      addOrUpdateIchimokuSeries(
        chartInstance,
        sortedData,
        {
          tenkan: activeIchimoku?.params?.tenkanPeriod || 9,
          kijun: activeIchimoku?.params?.kijunPeriod || 26,
          senkou: activeIchimoku?.params?.senkouSpanBPeriod || 52
        },
        {
          tenkan: tenkanSeries,
          kijun: kijunSeries,
          chikou: chikouSeries,
          cloud: cloudSeries
        }
      );
    } else {
      // 一目均衡表を非表示
      if (tenkanSeries.current || kijunSeries.current || chikouSeries.current || cloudSeries.current) {
        removeIchimokuSeries(chartInstance, {
          tenkan: tenkanSeries,
          kijun: kijunSeries,
          chikou: chikouSeries,
          cloud: cloudSeries
        });
      }
    }
  }, [activeIndicators, getPaneIndex]);
  
  // すべてのインジケーターをクリア
  const clearAllIndicators = useCallback((chartInstance: IChartApi) => {
    // RSIのクリア
    if (rsiSeries.current) {
      RSI.remove(chartInstance, rsiSeries);
    }
    
    // MACDのクリア
    if (macdSeries.current.macdLine.current) {
      MACD.remove(chartInstance, macdSeries.current);
    }
    
    // 一目均衡表のクリア
    if (tenkanSeries.current || kijunSeries.current || chikouSeries.current || cloudSeries.current) {
      removeIchimokuSeries(chartInstance, {
        tenkan: tenkanSeries,
        kijun: kijunSeries,
        chikou: chikouSeries,
        cloud: cloudSeries
      });
    }
    
    // Pane管理をリセット
    paneCounterRef.current = 1;
    paneMapRef.current = {};
    
    logger.info('すべてのインジケーターをクリアしました', {
      component: 'useIndicators',
      action: 'clearAllIndicators'
    });
  }, []);
  
  return {
    indicatorRefs: {
      rsiSeries,
      macdSeries,
      tenkanSeries,
      kijunSeries,
      chikouSeries,
      cloudSeries
    },
    updateIndicators,
    clearAllIndicators
  };
} 