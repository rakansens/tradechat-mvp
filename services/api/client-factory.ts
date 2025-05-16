// services/api/client-factory.ts
// 移動: apiClientFactory.tsから移動
// 更新: 2025-05-12 - インポートパスを新しいBitgetApiClientに更新

import { BitgetApiClient } from './bitget/client';
import { ExchangeType } from '@/types/constants/enums';

// APIクライアントのインスタンスをキャッシュ
const apiClients: Record<string, BitgetApiClient> = {};

/**
 * 指定された取引所タイプに対応するAPIクライアントを取得
 * 既に作成済みの場合はキャッシュから返す
 */
export function getApiClient(exchangeType: ExchangeType): BitgetApiClient {
  // キャッシュキーを作成
  const cacheKey = `bitget-${exchangeType}`;
  
  // キャッシュにあればそれを返す
  if (apiClients[cacheKey]) {
    return apiClients[cacheKey];
  }
  
  // 新しいインスタンスを作成 (credentials は空オブジェクト、exchangeType を第2引数に)
  const client = new BitgetApiClient({}, exchangeType);
  apiClients[cacheKey] = client;
  
  return client;
}
