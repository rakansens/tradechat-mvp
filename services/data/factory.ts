/**
 * services/data/factory.ts
 * データサービスのファクトリー
 * 
 * 作成: 2025-05-12 - 依存関係の管理と循環参照の防止のためのファクトリー
 */

import { IOrderBookService, IChartDataService } from './interfaces';
import { getChartDataService, resetChartDataServiceForTesting } from './chart-data-service';
import { orderBookService, resetOrderBookService } from './order-book-service';
import { dataFetchService } from './dataFetchService';
import { resetCacheService } from '../cache/service';
import { resetDataSourceFactory } from '../api/data-source-factory';
import { resetCCXWSClient } from '../ccxws/client';
import { resetWebSocketClientForTesting } from '../socket/websocket-client';
import { resetSubscriptionManagerForTesting } from '../socket/subscription-manager';
import { resetBitgetIntegrationForTesting } from '../socket/bitget-integration';
import { resetInstances as resetSocketInstances } from '../socket/factory';

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
  resetOrderBookService();
  resetCacheService();
  resetDataSourceFactory();
  resetCCXWSClient();
  resetSubscriptionManagerForTesting();
  resetBitgetIntegrationForTesting();
  resetWebSocketClientForTesting();
  resetSocketInstances();
}
