// services/apiClientFactory.ts
// 作成: APIクライアントファクトリー

import { BitgetApiClient } from './bitgetApi';
import { ExchangeType } from '@/types/api';

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
