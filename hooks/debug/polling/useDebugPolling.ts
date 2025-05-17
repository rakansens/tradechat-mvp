// hooks/debug/polling/useDebugPolling.ts
// Debug用ポーリングフック
// 更新: リファクタリングによりhooks/debug/polling/に移動

import { useState, useEffect, useRef } from 'react';

/**
 * デバッグ情報のポーリング管理フック
 * 
 * isDebugModeがtrueの場合、定期的に更新処理を実行し、
 * falseの場合はポーリングを停止する。
 *
 * 更新処理がまだ完了していない場合は、次のサイクルをスキップして
 * 連続実行による競合を防ぐ。
 */
export function useDebugPolling({
  isDebugMode,
  refreshFunctions = [],
  interval = 2000
}: {
  isDebugMode: boolean;
  refreshFunctions: Array<() => void>;
  interval?: number;
}) {
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const isRefreshing = useRef(false);
  
  // isDebugModeの変更に応じてポーリングを開始/終了
  useEffect(() => {
    if (isDebugMode) {
      const runRefresh = async () => {
        if (isRefreshing.current) return;
        isRefreshing.current = true;
        try {
          for (const fn of refreshFunctions) {
            await Promise.resolve(fn());
          }
        } finally {
          isRefreshing.current = false;
        }
      };

      // デバッグモードがアクティブな場合、インターバルを設定
      const intervalId = setInterval(runRefresh, interval);

      // 初回実行
      runRefresh();

      // 数値に型変換
      setRefreshInterval(intervalId as unknown as number);

      // クリーンアップ関数
      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    } else {
      // デバッグモードが非アクティブな場合、既存のインターバルをクリア
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [isDebugMode, refreshFunctions, interval]);
  
  return {
    isPolling: !!refreshInterval,
    refreshInterval
  };
} 