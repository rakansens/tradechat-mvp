"use client"

// components/chart/ChartContainer.tsx
// 作成: 分割されたチャートストアを使用するコンポーネント
// 
// このファイルは新しく分割されたチャートストアを使用する方法を示すサンプルコンポーネントです。
// クライアントコンポーネントとして明示的に宣言し、ハイドレーションエラーを回避

import React, { useEffect } from 'react';
import { useAppStore } from '../../store';
import { useChartConfigStore, useIndicatorStore, useDrawingToolStore, useRealTimeStore } from '../../store/chart';
import type { Timeframe } from '../../types/chart';
import type { ExchangeType } from '../../types/api';
import type { IndicatorType } from '../../types/store';
import { logger } from '../../utils/logger';

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
  
  // WebSocketからの取引タイプ変更イベントをリッスン
  useEffect(() => {
    const handleInstrumentTypeChange = (event: CustomEvent) => {
      const { type, fromType, symbol } = event.detail;
      logger.info(`WebSocketから取引タイプ変更イベントを受信: ${type}`, {
        component: 'ChartContainer',
        action: 'handleInstrumentTypeChange',
        data: event.detail,
        timestamp: Date.now(),
        currentExchangeType: exchangeType,
        currentSymbol: symbol,
        fromFuturesToSpot: type === 'spot' && (fromType === 'futures' || exchangeType === 'futures') ? '先物→現物の切り替え検出' : '他の切り替えパターン'
      });
      
      if (type === 'spot' || type === 'futures') {
        // イベントから銘柄を取得、なければ現在の銘柄を使用
        const targetSymbol = symbol || useAppStore.getState().currentSymbol || 'BTCUSDT';
        
        logger.info(`取引タイプ変更時の銘柄: ${targetSymbol}`, {
          component: 'ChartContainer',
          action: 'handleInstrumentTypeChange',
          type,
          fromType,
          targetSymbol
        });
        
        // 先物から現物への切り替えの場合、明示的に銘柄を先に設定
        if (type === 'spot' && (fromType === 'futures' || exchangeType === 'futures')) {
          logger.info(`先物から現物への切り替えを検出、銘柄を先に設定: ${targetSymbol}`, {
            component: 'ChartContainer',
            action: 'handleInstrumentTypeChange',
            targetSymbol
          });
          
          // 銘柄を即座に設定
          useAppStore.getState().setCurrentSymbol(targetSymbol, '先物→現物切り替え前の銘柄設定');
        }
        
        // AppStoreの取引タイプを更新（銘柄を明示的に指定）
        logger.info(`取引タイプを${exchangeType}から${type}に変更します`, {
          component: 'ChartContainer',
          action: 'handleInstrumentTypeChange',
          fromType: exchangeType,
          toType: type,
          symbol: targetSymbol
        });
        
        // 取引タイプを更新
        setExchangeType(type);
        
        // 現物から先物への切り替えの場合、または銘柄が変更された場合は、取引タイプ変更後に銘柄を再設定
        if ((type === 'futures' && fromType === 'spot') || targetSymbol !== currentSymbol) {
          logger.info(`取引タイプ変更後に銘柄を再設定: ${targetSymbol}`, {
            component: 'ChartContainer',
            action: 'handleInstrumentTypeChange',
            targetSymbol
          });
          
          // 少し遅延させて銘柄を再設定
          setTimeout(() => {
            useAppStore.getState().setCurrentSymbol(targetSymbol, '取引タイプ変更後の銘柄再設定');
          }, 100);
        }
      }
    };
    
    // グローバルイベントリスナーを追加
    window.addEventListener('instrumentTypeChanged', handleInstrumentTypeChange as EventListener);
    
    // クリーンアップ関数
    return () => {
      window.removeEventListener('instrumentTypeChanged', handleInstrumentTypeChange as EventListener);
    };
  }, [setExchangeType, exchangeType, currentSymbol]);
  
  // 銘柄変更イベントをリッスン
  useEffect(() => {
    const handleSymbolChanged = (event: CustomEvent) => {
      const { symbol } = event.detail;
      
      logger.info(`カスタムイベントから銘柄変更イベントを受信: ${symbol}`, {
        component: 'ChartContainer',
        action: 'handleSymbolChanged',
        currentSymbol,
        newSymbol: symbol,
        timestamp: new Date().toISOString()
      });
      
      if (symbol && symbol !== currentSymbol) {
        logger.info(`銘柄を${currentSymbol}から${symbol}に変更します`, {
          component: 'ChartContainer',
          action: 'handleSymbolChanged',
          fromSymbol: currentSymbol,
          toSymbol: symbol
        });
        
        // AppStoreの銘柄を更新
        setCurrentSymbol(symbol, 'カスタムイベントからの銘柄変更');
        
        // データを再取得
        setTimeout(() => {
          fetchChartData(symbol);
        }, 100);
      }
    };
    
    // グローバルイベントリスナーを追加
    window.addEventListener('symbolChanged', handleSymbolChanged as EventListener);
    
    // クリーンアップ関数
    return () => {
      window.removeEventListener('symbolChanged', handleSymbolChanged as EventListener);
    };
  }, [currentSymbol, setCurrentSymbol, fetchChartData]);
  
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
