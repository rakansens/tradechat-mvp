// hooks/chart/test-hooks.ts
// 作成: リファクタリングで実装したフックをテストするためのファイル
// 役割:
// 1. フックの基本的な動作をコンソールに出力
// 2. フックの依存関係が問題なく解決されることを確認

import { usePriceMetrics } from './usePriceMetrics';
import { useToolbarStores } from './useToolbarStores';
import { useToolbarEvents } from './useToolbarEvents';

/**
 * テスト用のコンポーネントで、フックをインポートして使用する例
 */
export function TestHooks() {
  // ChartDataStoreから状態を取得
  const { chartDataStore } = useToolbarStores();
  const { chartData } = chartDataStore;
  
  // 価格情報を計算
  const { currentPrice, priceChangePercent } = usePriceMetrics(chartData);
  
  // カスタムイベントリスナーを設定
  useToolbarEvents();
  
  console.log('フックテスト成功:', {
    chartDataAvailable: !!chartData,
    currentPrice,
    priceChangePercent
  });
  
  return null;
}

// 単体でエクスポートしておく
export { usePriceMetrics, useToolbarStores, useToolbarEvents }; 