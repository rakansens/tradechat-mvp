// hooks/useChartCanvas.ts
// 作成: チャートのコア機能を管理するカスタムフック
// ドメイン層とプレゼンテーション層の橋渡しをする責務を持つ
// 更新: インポートと型の問題を修正

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  ChartOptions, 
  DeepPartial,
  Time,
  CandlestickData,
  LineData,
  SeriesType
} from 'lightweight-charts';
import { ChartTimeframe, ChartCandle } from '@/types/chartModels';
import { logger } from '@/utils/logger';

// モックストア（実際の実装では既存のストアを使用）
interface MockChartStore {
  currentTimeframe: ChartTimeframe;
  chartOptions: DeepPartial<ChartOptions>;
  visibleIndicators: {
    ma7: boolean;
    ma25: boolean;
    ma99: boolean;
    bollinger: boolean;
    rsi: boolean;
    macd: boolean;
  };
  updateTimeframe: (timeframe: ChartTimeframe) => void;
  updateChartOptions: (options: DeepPartial<ChartOptions>) => void;
}

interface MockMarketDataStore {
  marketData: { candles: ChartCandle[], timestamp: number } | null;
  isLoading: boolean;
  fetchMarketData: (timeframe: ChartTimeframe) => Promise<void>;
}

// モックデータの生成
const generateDummyCandles = (count: number): ChartCandle[] => {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  
  return Array.from({ length: count }, (_, i) => {
    const basePrice = 50000;
    const volatility = 1000;
    
    const time = now - (count - i) * hour;
    const open = basePrice - volatility/2 + Math.random() * volatility;
    const close = basePrice - volatility/2 + Math.random() * volatility;
    const high = Math.max(open, close) + Math.random() * 300;
    const low = Math.min(open, close) - Math.random() * 300;
    
    return {
      time: time / 1000, // Unix timestamp in seconds
      open,
      high,
      low,
      close,
      volume: 100 + Math.random() * 900
    };
  });
};

// モックストアの作成
const mockChartStore: MockChartStore = {
  currentTimeframe: '1h',
  chartOptions: {
    layout: {
      background: { color: 'transparent' },
      textColor: '#D9D9D9',
    },
  },
  visibleIndicators: {
    ma7: true,
    ma25: true,
    ma99: false,
    bollinger: true,
    rsi: false,
    macd: false,
  },
  updateTimeframe: (timeframe) => {
    mockChartStore.currentTimeframe = timeframe;
  },
  updateChartOptions: (options) => {
    mockChartStore.chartOptions = { ...mockChartStore.chartOptions, ...options };
  }
};

// モックマーケットデータストアの作成
const dummyCandles = generateDummyCandles(100);
const mockMarketDataStore: MockMarketDataStore = {
  marketData: { candles: dummyCandles, timestamp: Date.now() },
  isLoading: false,
  fetchMarketData: async (timeframe) => {
    mockMarketDataStore.isLoading = true;
    await new Promise(resolve => setTimeout(resolve, 500));
    mockMarketDataStore.marketData = { 
      candles: generateDummyCandles(100), 
      timestamp: Date.now() 
    };
    mockMarketDataStore.isLoading = false;
  }
};

export interface ChartSize {
  width: number;
  height: number;
}

export function useChartCanvas(containerRef: React.RefObject<HTMLDivElement>) {
  // チャートインスタンスと各種シリーズの参照
  const [chart, setChart] = useState<IChartApi | null>(null);
  const candleSeries = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const indicatorSeries = useRef<Record<string, ISeriesApi<'Line'>>>({});
  
  // チャートのサイズ状態
  const [size, setSize] = useState<ChartSize>({ width: 0, height: 0 });
  
  // ストアからデータを取得（モックストアを使用）
  const { 
    currentTimeframe, 
    chartOptions,
    visibleIndicators,
    updateTimeframe,
    updateChartOptions 
  } = mockChartStore;
  
  const { 
    marketData, 
    isLoading,
    fetchMarketData 
  } = mockMarketDataStore;
  
  // 変換後のチャートデータ
  const [chartData, setChartData] = useState<ChartCandle[]>([]);
  
  // チャート初期化
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    const defaultOptions: DeepPartial<ChartOptions> = {
      width,
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: '#D9D9D9',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.6)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.6)' },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: 'rgba(197, 203, 206, 0.8)',
      },
      crosshair: {
        mode: 1
      },
      ...chartOptions,
    };
    
    // チャートインスタンス作成
    const chartInstance = createChart(container, defaultOptions);
    setChart(chartInstance);
    setSize({ width, height });
    
    // クリーンアップ関数
    return () => {
      if (chartInstance) {
        chartInstance.remove();
      }
    };
  }, [containerRef, chartOptions]);
  
  // リサイズハンドラ
  const handleResize = useCallback(() => {
    if (!containerRef.current || !chart) return;
    
    const container = containerRef.current;
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    
    if (newWidth !== size.width || newHeight !== size.height) {
      chart.applyOptions({ width: newWidth, height: newHeight });
      setSize({ width: newWidth, height: newHeight });
    }
  }, [chart, containerRef, size.width, size.height]);
  
  // リサイズイベントのリスナー設定
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);
  
  // データが変更されたときのハンドラ
  useEffect(() => {
    if (!marketData || !marketData.candles || marketData.candles.length === 0) {
      // データが空の場合はデータをフェッチ
      fetchMarketData(currentTimeframe);
      return;
    }
    
    try {
      // キャンドルデータを設定
      setChartData(marketData.candles);
    } catch (error) {
      logger.error('Failed to transform chart data', error);
    }
  }, [marketData, currentTimeframe, fetchMarketData]);
  
  // タイムフレーム変更ハンドラー
  const changeTimeframe = useCallback((timeframe: ChartTimeframe) => {
    updateTimeframe(timeframe);
    fetchMarketData(timeframe);
  }, [updateTimeframe, fetchMarketData]);
  
  // チャートオプション更新ハンドラー
  const applyChartOptions = useCallback((options: DeepPartial<ChartOptions>) => {
    if (chart) {
      chart.applyOptions(options);
    }
    updateChartOptions(options);
  }, [chart, updateChartOptions]);
  
  // キャンドルシリーズの参照を設定するコールバック
  const setCandleSeries = useCallback((series: ISeriesApi<'Candlestick'>) => {
    candleSeries.current = series;
  }, []);
  
  // 指標シリーズの参照を設定するコールバック
  const setIndicatorSeries = useCallback((id: string, series: ISeriesApi<'Line'>) => {
    indicatorSeries.current[id] = series;
  }, []);
  
  return {
    chart,
    chartData,
    isLoading,
    size,
    currentTimeframe,
    visibleIndicators,
    changeTimeframe,
    applyChartOptions,
    setCandleSeries,
    setIndicatorSeries,
  };
} 