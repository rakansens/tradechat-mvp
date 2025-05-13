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
  const updateTimeFrame = useRootStore((state) => state.updateTimeFrame);
  
  // キーボードショートカットの設定
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // タイムフレーム切り替えのショートカット
      if (e.altKey) {
        switch (e.key) {
          case '1':
            updateTimeFrame('1m' as Timeframe);
            break;
          case '5':
            updateTimeFrame('5m' as Timeframe);
            break;
          case '2':
            updateTimeFrame('15m' as Timeframe);
            break;
          case '3':
            updateTimeFrame('30m' as Timeframe);
            break;
          case 'h':
          case 'H':
            updateTimeFrame('1h' as Timeframe);
            break;
          case '4':
            updateTimeFrame('4h' as Timeframe);
            break;
          case 'd':
          case 'D':
            updateTimeFrame('1d' as Timeframe);
            break;
          case 'w':
          case 'W':
            updateTimeFrame('1w' as Timeframe);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [updateTimeFrame]);

  return null;
}

export default useToolbarEvents; 