import { useState, useEffect } from 'react';

/**
 * デバッグ情報のポーリング管理フック
 * 
 * isDebugModeがtrueの場合、定期的に更新処理を実行し、
 * falseの場合はポーリングを停止する
 * 
 * 更新: リファクタリングによりhooks/debug/polling/に移動
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
  
  // isDebugModeの変更に応じてポーリングを開始/終了
  useEffect(() => {
    if (isDebugMode) {
      // デバッグモードがアクティブな場合、インターバルを設定
      const intervalId = setInterval(() => {
        // 全ての更新関数を実行
        refreshFunctions.forEach(fn => fn());
      }, interval);
      
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