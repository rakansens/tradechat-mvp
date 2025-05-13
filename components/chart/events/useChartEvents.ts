/**
 * components/chart/events/useChartEvents.ts
 * チャートイベントの管理を担当するHook
 * 
 * 変更履歴:
 * - 2025-05-15: ChartCanvas.tsxから責務分離の一環として作成
 */

import { useEffect } from 'react';
import { Timeframe } from '@/types/chart';
import { logger } from '@/utils/logger';
import { useChartDataStore } from '@/store';

// カスタムイベントの型定義
interface TimeframeChangedEvent extends CustomEvent {
  detail: {
    timeframe: Timeframe;
  };
}

interface SymbolChangedEvent extends CustomEvent {
  detail: {
    symbol: string;
  };
}

// フックの戻り値の型定義
export interface UseChartEventsReturn {
  emitTimeframeChanged: (timeframe: Timeframe) => void;
  emitSymbolChanged: (symbol: string) => void;
}

/**
 * チャートイベント管理フック
 * - カスタムイベントのリスナー設定
 * - イベント発行メソッドの提供
 */
export function useChartEvents(): UseChartEventsReturn {
  // Socket.IOイベントリスナーの設定
  useEffect(() => {
    // 時間足変更イベントのリスナー
    const handleTimeframeChange = (event: CustomEvent) => {
      const { timeframe } = event.detail;
      logger.info(`時間足変更イベントを受信: ${timeframe}`, {
        component: 'useChartEvents',
        action: 'handleTimeframeChange'
      });
      
      // チャートデータストアの時間足を更新
      useChartDataStore.getState().updateTimeFrame(timeframe as Timeframe);
      
      // ツールバーの選択状態を更新するためのカスタムイベント
      const updateEvent = new CustomEvent('updateToolbarTimeframe', { detail: { timeframe } });
      window.dispatchEvent(updateEvent);
    };
    
    // 銘柄変更イベントのリスナー
    const handleSymbolChange = (event: CustomEvent) => {
      const { symbol } = event.detail;
      logger.info(`銘柄変更イベントを受信: ${symbol}`, {
        component: 'useChartEvents',
        action: 'handleSymbolChange'
      });
      
      // チャートデータストアの銘柄を更新
      useChartDataStore.getState().updateSymbol(symbol);
      
      // ツールバーの選択状態を更新するためのカスタムイベント
      const updateEvent = new CustomEvent('updateToolbarSymbol', { detail: { symbol } });
      window.dispatchEvent(updateEvent);
    };
    
    // イベントリスナーを登録
    window.addEventListener('timeframeChanged', handleTimeframeChange as EventListener);
    window.addEventListener('symbolChanged', handleSymbolChange as EventListener);
    
    // クリーンアップ関数
    return () => {
      window.removeEventListener('timeframeChanged', handleTimeframeChange as EventListener);
      window.removeEventListener('symbolChanged', handleSymbolChange as EventListener);
    };
  }, []);
  
  // 時間足変更イベントを発行
  const emitTimeframeChanged = (timeframe: Timeframe) => {
    const event = new CustomEvent('timeframeChanged', { detail: { timeframe } });
    window.dispatchEvent(event);
    
    logger.info(`時間足変更イベントを発行: ${timeframe}`, {
      component: 'useChartEvents',
      action: 'emitTimeframeChanged'
    });
  };
  
  // 銘柄変更イベントを発行
  const emitSymbolChanged = (symbol: string) => {
    const event = new CustomEvent('symbolChanged', { detail: { symbol } });
    window.dispatchEvent(event);
    
    logger.info(`銘柄変更イベントを発行: ${symbol}`, {
      component: 'useChartEvents',
      action: 'emitSymbolChanged'
    });
  };
  
  return {
    emitTimeframeChanged,
    emitSymbolChanged
  };
} 