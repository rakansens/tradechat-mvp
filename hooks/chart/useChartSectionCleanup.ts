/**
 * hooks/chart/useChartSectionCleanup.ts
 * @deprecated hooks/chart/init/useChartSectionCleanup.ts に移動しました
 * 
 * チャートセクションのクリーンアップロジックを担当するフック
 * 
 * 変更履歴:
 * - 2023-06-04: ChartSection.tsxのリファクタリングに伴い作成
 */

import { useEffect } from 'react';
import { logger } from '@/utils/common';

interface UseChartSectionCleanupProps {
  stopRealTimeUpdates: () => void;
}

/**
 * チャートセクションのクリーンアップロジックを担当するフック
 * 
 * コンポーネントのアンマウント時に:
 * - リアルタイムデータの更新を停止
 * - 必要に応じて他のリソースを解放
 */
export const useChartSectionCleanup = ({
  stopRealTimeUpdates
}: UseChartSectionCleanupProps) => {
  // コンポーネントのアンマウント時にクリーンアップを実行
  useEffect(() => {
    // クリーンアップ関数
    return () => {
      logger.info('チャートセクションのクリーンアップを実行します', {
        component: 'useChartSectionCleanup',
        action: 'cleanup'
      });
      
      // リアルタイムデータの更新を停止
      stopRealTimeUpdates();
    };
  }, [stopRealTimeUpdates]);
}; 