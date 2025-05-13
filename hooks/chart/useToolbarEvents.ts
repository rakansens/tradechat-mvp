// hooks/chart/useToolbarEvents.ts
// 作成: チャートツールバーで使用するカスタムイベント処理を管理するフック
// 役割:
// 1. CustomEventの登録/解除を一元管理
// 2. イベントデータをストアに反映する処理をカプセル化

import { useEffect } from 'react';
import { useChartDataStore, useSymbolStore } from '@/store';
import { Timeframe } from '@/types/chart';

/**
 * チャートツールバーで使用するカスタムイベント処理を管理するフック
 * 
 * - updateToolbarTimeframe: 時間足変更イベント
 * - updateToolbarSymbol: 銘柄変更イベント
 * 
 * @returns void
 */
export function useToolbarEvents() {
  // Socket.IOイベントリスナーの設定
  useEffect(() => {
    // 時間足変更イベントのリスナー
    const handleTimeframeUpdate = (event: CustomEvent) => {
      const { timeframe } = event.detail;
      console.log(`ツールバーの時間足を更新: ${timeframe}`);
      // ChartDataStoreの時間足を更新
      // データの再取得は行わず、UIの更新のみ行う
      useChartDataStore.setState({ currentTimeFrame: timeframe as Timeframe });
    };
    
    // 銘柄変更イベントのリスナー
    const handleSymbolUpdate = (event: CustomEvent) => {
      const { symbol } = event.detail;
      console.log(`ツールバーの銘柄を更新: ${symbol}`);
      // SymbolStoreの銘柄を更新
      // アクティブシンボルをローカルストレージに保存
      useSymbolStore.getState().setCurrentSymbol(symbol, 'ToolbarEvents.updateSymbol');
    };
    
    // イベントリスナーを登録
    window.addEventListener('updateToolbarTimeframe', handleTimeframeUpdate as EventListener);
    window.addEventListener('updateToolbarSymbol', handleSymbolUpdate as EventListener);
    
    // クリーンアップ関数
    return () => {
      window.removeEventListener('updateToolbarTimeframe', handleTimeframeUpdate as EventListener);
      window.removeEventListener('updateToolbarSymbol', handleSymbolUpdate as EventListener);
    };
  }, []);
}

export default useToolbarEvents; 