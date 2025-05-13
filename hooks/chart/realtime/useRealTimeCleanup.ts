/**
 * hooks/chart/realtime/useRealTimeCleanup.ts
 * リアルタイムデータ更新のクリーンアップを担当するフック
 * 
 * 変更履歴:
 * - 2023-06-01: ChartContainer.tsxのリファクタリングに伴い作成
 * - 2025-05-20: useRealTimeStoreをuseRootStoreに置き換え
 * - 更新: 2025-06-15: chart/realtime/ サブディレクトリに移動
 */

import { useEffect } from 'react';
import { useRootStore } from '@/store';
import { logger } from '@/utils/common';

/**
 * コンポーネントのアンマウント時にリアルタイム更新を停止するフック
 * 
 * リアルタイムデータが有効な場合のみ、クリーンアップ関数を設定します。
 * これにより、コンポーネントがアンマウントされた際にメモリリークを防止します。
 */
export const useRealTimeCleanup = () => {
  // リアルタイムデータの使用状態を取得
  const useRealTimeData = useRootStore(s => s.useRealTimeData);
  
  useEffect(() => {
    // リアルタイムデータが有効な場合のみ、クリーンアップ関数を設定
    return () => {
      if (useRealTimeData) {
        logger.info('リアルタイムデータの更新を停止します', {
          component: 'useRealTimeCleanup',
          action: 'cleanup',
          timestamp: new Date().toISOString()
        });
        useRootStore.getState().stopRealTimeUpdates();
      }
    };
  }, [useRealTimeData]);
}; 