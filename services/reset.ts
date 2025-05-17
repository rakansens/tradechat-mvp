import { resetChartDataServiceForTesting } from './data/chart-data-service';
import { resetOrderBookService } from './data/order-book-service';
import { resetCacheService } from './cache/service';
import { resetDataSourceFactory } from './api/data-source-factory';
import { resetCCXWSClient } from './ccxws/client';
import { resetInstances as resetSocketInstances } from './socket/factory';
import { resetWebSocketClientForTesting } from './socket/websocket-client';
import { resetSubscriptionManagerForTesting } from './socket/subscription-manager';
import { resetBitgetIntegrationForTesting } from './socket/bitget-integration';

/**
 * すべてのサービスを初期状態にリセットするヘルパー
 */
export function resetAllServices(): void {
  resetChartDataServiceForTesting();
  resetOrderBookService();
  resetCacheService();
  resetDataSourceFactory();
  resetCCXWSClient();
  resetWebSocketClientForTesting();
  resetSubscriptionManagerForTesting();
  resetBitgetIntegrationForTesting();
  resetSocketInstances();
}
