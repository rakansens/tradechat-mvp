// services/api/client-factory.ts
// 移動: apiClientFactory.tsから移動
// 更新: 2025-05-12 - インポートパスを新しいBitgetApiClientに更新

import { BitgetApiClient } from './bitget/client.new';
import { ExchangeType, ProductType } from '@/types/exchange';
import { safeExchangeType } from '@/utils/exchangeTypeUtils';

// APIクライアントのインスタンスをキャッシュ
const apiClients: Record<string, BitgetApiClient> = {};

/**
 * 指定された取引所タイプまたは取引種別に対応するAPIクライアントを取得
 * 既に作成済みの場合はキャッシュから返す
 * @param exchangeType 取引所タイプ(ExchangeType)または取引種別(ProductType)
 * @returns 対応するAPIクライアントインスタンス
 */
export function getApiClient(exchangeType: ExchangeType | ProductType): BitgetApiClient {
  // キャッシュキーを作成
  const cacheKey = `bitget-${exchangeType}`;
  
  // キャッシュにあればそれを返す
  if (apiClients[cacheKey]) {
    return apiClients[cacheKey];
  }
  
  // 新しいインスタンスを作成 (credentials は空オブジェクト、exchangeType を第2引数に)
  // exchangeTypeを安全に変換してBitgetApiClientに渡す
  const normalizedExchangeType = safeExchangeType(exchangeType);
  const client = new BitgetApiClient({}, normalizedExchangeType);
  apiClients[cacheKey] = client;
  
  return client;
}
