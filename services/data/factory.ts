/**
 * services/data/factory.ts
 * データサービスのファクトリー
 * 
 * 作成: 2025-05-12 - 依存関係の管理と循環参照の防止のためのファクトリー
 */

import { IOrderBookService, IChartDataService } from './interfaces';
import { getChartDataService, resetChartDataServiceForTesting } from './chart-data-service';
import { orderBookService } from './order-book-service';
import { dataFetchService } from './dataFetchService';

// モックモード判定
const isMockMode = process.env.MOCK_MODE === 'true';

/**
 * チャートデータサービスを取得
 * @returns IChartDataServiceインスタンス
 */
export function getChartDataServiceFactory(): IChartDataService {
  return getChartDataService();
}

/**
 * オーダーブックサービスを取得
 * @returns IOrderBookServiceインスタンス
 */
export function getOrderBookServiceFactory(): IOrderBookService {
  return orderBookService;
}

/**
 * @deprecated 代わりにgetChartDataServiceFactoryとgetOrderBookServiceFactoryを使用してください
 * @returns 非推奨のdataFetchService
 */
export function getDataFetchServiceFactory() {
  return dataFetchService;
}

/**
 * テスト用にすべてのサービスをリセット
 */
export function resetAllServicesForTesting(): void {
  resetChartDataServiceForTesting();
  // 他のサービスのリセット関数があれば追加
}
