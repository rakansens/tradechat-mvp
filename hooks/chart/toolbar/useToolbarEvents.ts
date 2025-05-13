/**
 * hooks/chart/toolbar/useToolbarEvents.ts
 * チャートツールバーで使用するカスタムイベント処理を管理するフック
 * 
 * 役割:
 * 1. CustomEventの登録/解除を一元管理
 * 2. イベントデータをストアに反映する処理をカプセル化
 * 
 * 変更履歴:
 * - 作成: ChartToolbar.tsxのリファクタリングに伴い作成
 * - 更新: useChartDataStoreをuseRootStoreに置き換え
 * - 更新: 古いuseSymbolStoreをrootStoreのSymbolSliceに置き換え
 * - 更新: 2025-06-15: chart/toolbar/ サブディレクトリに移動
 */

import { useEffect } from 'react';
// useSymbolStoreを削除
import { useRootStore } from '@/store';
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
      // RootStoreの時間足を更新
      // データの再取得は行わず、UIの更新のみ行う
      useRootStore.setState({ currentTimeFrame: timeframe as Timeframe });
    };
    
    // 銘柄変更イベントのリスナー
    const handleSymbolUpdate = (event: CustomEvent) => {
      const { symbol } = event.detail;
      console.log(`ツールバーの銘柄を更新: ${symbol}`);
      // SymbolSliceの銘柄を更新（rootStoreから）
      // アクティブシンボルをローカルストレージに保存
      useRootStore.getState().setCurrentSymbol(symbol, 'ToolbarEvents.updateSymbol');
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