// components/chart/ChartContainer.tsx
// 作成: 分割されたチャートストアを使用するコンポーネント
// 
// このファイルは新しく分割されたチャートストアを使用する方法を示すサンプルコンポーネントです。

import React, { useEffect } from 'react';
import { 
  useChartDataStore,
  useChartConfigStore, 
  useIndicatorStore,
  useDrawingToolStore,
  useRealTimeStore
} from '../../store';
import type { Timeframe } from '../../types/chart';
import type { ExchangeType } from '../../types/api';

export const ChartContainer: React.FC = () => {
  // 各ストアから状態を取得
  const { 
    data, 
    currentSymbol, 
    currentTimeFrame, 
    isLoading, 
    error,
    fetchData,
    updateTimeFrame,
    updateSymbol
  } = useChartDataStore();
  
  const {
    chartType,
    exchangeType,
    setChartType,
    setExchangeType
  } = useChartConfigStore();
  
  const {
    activeIndicators,
    toggleIndicator,
    clearAllIndicators
  } = useIndicatorStore();
  
  const {
    activeDrawingTools,
    toggleDrawingTool,
    clearAllDrawingTools
  } = useDrawingToolStore();
  
  const {
    useRealTimeData,
    toggleRealTimeData
  } = useRealTimeStore();
  
  // コンポーネントマウント時にデータを取得 (setTimeout + AbortController)
  useEffect(() => {
    const symbol = currentSymbol;
    const timeframe = currentTimeFrame;

    let lastPollTime = 0;
    const timeoutRef = { current: null as NodeJS.Timeout | null };
    const abortRef = { current: null as AbortController | null };

    const poll = async () => {
      // シンボル / timeframe チェック
      const storeState = useChartDataStore.getState();
      if (storeState.currentSymbol !== symbol || storeState.currentTimeFrame !== timeframe) {
        console.log('ChartContainer: symbol/timeframe changed, stop polling');
        console.trace('ChartContainer mismatch stack');
        return;
      }

      // 最低 15 秒間隔
      const now = Date.now();
      if (now - lastPollTime < 15000) {
        timeoutRef.current = setTimeout(poll, 15000 - (now - lastPollTime));
        return;
      }

      // Abort previous
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await fetchData(symbol, timeframe, controller.signal as any);
        lastPollTime = Date.now();
      } catch (err: any) {
        if (err?.name !== 'AbortError') console.error(err);
      }

      timeoutRef.current = setTimeout(poll, 15000);
    };

    // 初期ロード
    poll();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abortRef.current) abortRef.current.abort();
      if (useRealTimeData) useRealTimeStore.getState().stopRealTimeUpdates();
    };
  }, [currentSymbol, currentTimeFrame]);

  // タイムフレーム変更ハンドラー
  const handleTimeFrameChange = (newTimeFrame: Timeframe) => {
    updateTimeFrame(newTimeFrame);
  };
  
  // シンボル変更ハンドラー
  const handleSymbolChange = (newSymbol: string) => {
    updateSymbol(newSymbol);
  };
  
  // 取引種別変更ハンドラー
  const handleExchangeTypeChange = (newType: ExchangeType) => {
    setExchangeType(newType);
  };
  
  // チャートタイプ変更ハンドラー
  const handleChartTypeChange = (newType: 'candles' | 'line' | 'area') => {
    setChartType(newType);
  };
  
  // インジケーター切り替えハンドラー
  const handleToggleIndicator = (indicator: 'rsi' | 'macd' | 'ichimoku') => {
    toggleIndicator(indicator);
  };
  
  // 描画ツール切り替えハンドラー
  const handleToggleDrawingTool = (tool: 'fibonacci' | 'rectangle') => {
    toggleDrawingTool(tool);
  };
  
  // リアルタイムデータ切り替えハンドラー
  const handleToggleRealTimeData = () => {
    toggleRealTimeData();
  };
  
  // ローディング中の表示
  if (isLoading) {
    return <div>Loading chart data...</div>;
  }
  
  // エラー時の表示
  if (error) {
    return <div>Error loading chart: {error}</div>;
  }
  
  return (
    <div className="chart-container">
      <div className="chart-header">
        <h2>{currentSymbol} - {currentTimeFrame}</h2>
        
        <div className="chart-controls">
          {/* タイムフレーム選択 */}
          <div className="timeframe-selector">
            <button 
              className={currentTimeFrame === '1m' ? 'active' : ''} 
              onClick={() => handleTimeFrameChange('1m')}
            >
              1m
            </button>
            <button 
              className={currentTimeFrame === '5m' ? 'active' : ''} 
              onClick={() => handleTimeFrameChange('5m')}
            >
              5m
            </button>
            <button 
              className={currentTimeFrame === '15m' ? 'active' : ''} 
              onClick={() => handleTimeFrameChange('15m')}
            >
              15m
            </button>
            <button 
              className={currentTimeFrame === '1h' ? 'active' : ''} 
              onClick={() => handleTimeFrameChange('1h')}
            >
              1h
            </button>
            <button 
              className={currentTimeFrame === '4h' ? 'active' : ''} 
              onClick={() => handleTimeFrameChange('4h')}
            >
              4h
            </button>
            <button 
              className={currentTimeFrame === '1d' ? 'active' : ''} 
              onClick={() => handleTimeFrameChange('1d')}
            >
              1d
            </button>
          </div>
          
          {/* チャートタイプ選択 */}
          <div className="chart-type-selector">
            <button 
              className={chartType === 'candles' ? 'active' : ''} 
              onClick={() => handleChartTypeChange('candles')}
            >
              Candles
            </button>
            <button 
              className={chartType === 'line' ? 'active' : ''} 
              onClick={() => handleChartTypeChange('line')}
            >
              Line
            </button>
            <button 
              className={chartType === 'area' ? 'active' : ''} 
              onClick={() => handleChartTypeChange('area')}
            >
              Area
            </button>
          </div>
          
          {/* 取引種別選択 */}
          <div className="exchange-type-selector">
            <button 
              className={exchangeType === 'spot' ? 'active' : ''} 
              onClick={() => handleExchangeTypeChange('spot')}
            >
              Spot
            </button>
            <button 
              className={exchangeType === 'futures' ? 'active' : ''} 
              onClick={() => handleExchangeTypeChange('futures')}
            >
              Futures
            </button>
          </div>
          
          {/* リアルタイムデータ切り替え */}
          <div className="realtime-toggle">
            <button 
              className={useRealTimeData ? 'active' : ''} 
              onClick={handleToggleRealTimeData}
            >
              {useRealTimeData ? 'Real-time: ON' : 'Real-time: OFF'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="chart-body">
        {/* ここに実際のチャートを描画するコンポーネントを配置 */}
        <div className="chart-placeholder">
          <p>Chart for {currentSymbol} ({currentTimeFrame})</p>
          <p>Chart Type: {chartType}</p>
          <p>Exchange Type: {exchangeType}</p>
          <p>Data Points: {data.length}</p>
          <p>
            Active Indicators: 
            {activeIndicators.length === 0 
              ? ' None' 
              : ` ${activeIndicators.join(', ')}`
            }
          </p>
          <p>
            Active Drawing Tools: 
            {activeDrawingTools.length === 0 
              ? ' None' 
              : ` ${activeDrawingTools.join(', ')}`
            }
          </p>
        </div>
      </div>
      
      <div className="chart-footer">
        <div className="indicator-controls">
          <h4>Indicators</h4>
          <button 
            className={activeIndicators.includes('rsi') ? 'active' : ''} 
            onClick={() => handleToggleIndicator('rsi')}
          >
            RSI
          </button>
          <button 
            className={activeIndicators.includes('macd') ? 'active' : ''} 
            onClick={() => handleToggleIndicator('macd')}
          >
            MACD
          </button>
          <button 
            className={activeIndicators.includes('ichimoku') ? 'active' : ''} 
            onClick={() => handleToggleIndicator('ichimoku')}
          >
            Ichimoku
          </button>
          <button onClick={clearAllIndicators}>
            Clear All
          </button>
        </div>
        
        <div className="drawing-tool-controls">
          <h4>Drawing Tools</h4>
          <button 
            className={activeDrawingTools.includes('fibonacci') ? 'active' : ''} 
            onClick={() => handleToggleDrawingTool('fibonacci')}
          >
            Fibonacci
          </button>
          <button 
            className={activeDrawingTools.includes('rectangle') ? 'active' : ''} 
            onClick={() => handleToggleDrawingTool('rectangle')}
          >
            Rectangle
          </button>
          <button onClick={clearAllDrawingTools}>
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
};
