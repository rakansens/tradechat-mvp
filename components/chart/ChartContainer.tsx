// components/chart/ChartContainer.tsx
// 作成: 分割されたチャートストアを使用するコンポーネント
// 
// このファイルは新しく分割されたチャートストアを使用する方法を示すサンプルコンポーネントです。

import React, { useEffect } from 'react';
import { useAppStore } from '../../store';
import { useChartConfigStore, useIndicatorStore, useDrawingToolStore, useRealTimeStore } from '../../store/chart';
import type { Timeframe } from '../../types/chart';
import type { ExchangeType } from '../../types/api';
import type { IndicatorType } from '../../types/store';

export const ChartContainer: React.FC = () => {
  // AppStoreから状態を取得
  const currentSymbol = useAppStore(state => state.currentSymbol);
  const currentTimeFrame = useAppStore(state => state.currentTimeFrame);
  const isLoading = useAppStore(state => state.isLoadingChartData);
  const error = useAppStore(state => state.chartError);
  const chartData = useAppStore(state => state.chartData);
  const exchangeType = useAppStore(state => state.exchangeType);
  
  // AppStoreからアクションを取得
  const updateTimeFrame = useAppStore(state => state.updateTimeFrame);
  const setCurrentSymbol = useAppStore(state => state.setCurrentSymbol);
  const fetchChartData = useAppStore(state => state.fetchChartData);
  const setExchangeType = useAppStore(state => state.setExchangeType);
  
  // チャート関連のストアから状態を取得
  const {
    chartType,
    setChartType
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
  // コンポーネントマウント時にリアルタイムデータの設定を確認
  useEffect(() => {
    // リアルタイムデータが有効な場合のみ、クリーンアップ関数を設定
    return () => {
      if (useRealTimeData) useRealTimeStore.getState().stopRealTimeUpdates();
    };
  }, [useRealTimeData]);
  
  // 注意: チャートデータのポーリングはuseAppStoreで一元管理されるため、
  // このコンポーネントでのポーリング実装は削除されました

  // タイムフレーム変更ハンドラー
  const handleTimeFrameChange = (newTimeFrame: Timeframe) => {
    updateTimeFrame(newTimeFrame);
  };
  
  // シンボル変更ハンドラー
  const handleSymbolChange = (newSymbol: string) => {
    setCurrentSymbol(newSymbol);
  };
  
  // 取引種別変更ハンドラー
  const handleExchangeTypeChange = (newType: ExchangeType) => {
    // AppStoreのsetExchangeType関数を呼び出してグローバル状態を更新
    setExchangeType(newType);
    console.log(`取引種別を変更しました: ${newType}`);
  };
  
  // チャートタイプ変更ハンドラー
  const handleChartTypeChange = (newType: 'candles' | 'line' | 'area') => {
    setChartType(newType);
  };
  
  // インジケーター切り替えハンドラー
  const handleToggleIndicator = (indicator: 'rsi' | 'macd' | 'ichimoku') => {
    toggleIndicator(indicator as IndicatorType);
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
          <p>Data Points: {chartData ? chartData.length : 0}</p>
          <p>
            Active Indicators: 
            {activeIndicators.length === 0 
              ? ' None' 
              : ` ${activeIndicators.map(ind => ind.type).join(', ')}`
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
            className={activeIndicators.some(ind => ind.type === 'rsi') ? 'active' : ''} 
            onClick={() => handleToggleIndicator('rsi')}
          >
            RSI
          </button>
          <button 
            className={activeIndicators.some(ind => ind.type === 'macd') ? 'active' : ''} 
            onClick={() => handleToggleIndicator('macd')}
          >
            MACD
          </button>
          <button 
            className={activeIndicators.some(ind => ind.type === 'ichimoku') ? 'active' : ''} 
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
