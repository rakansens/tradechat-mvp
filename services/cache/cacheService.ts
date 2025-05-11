/**
 * services/cache/cacheService.ts
 * キャッシュサービスの実装
 * 
 * 作成: キャッシュサービスの実装
 */

import { ICacheService, CacheStats, CacheEntry } from './cacheTypes';
import { logger } from '../../utils/logger';

export class CacheService implements ICacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly WS_CACHE_TTL = 60000; // WebSocketデータは60秒キャッシュ
  private readonly REST_CACHE_TTL = 30000; // RESTデータは30秒キャッシュ

  /**
   * キャッシュからデータを取得
   * @param key キャッシュキー
   * @returns キャッシュされたデータ、または存在しない場合はnull
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // キャッシュ有効期限チェック（ソースによって有効期限を変える）
    const ttl = item.source === 'websocket' ? this.WS_CACHE_TTL : this.REST_CACHE_TTL;
    if (Date.now() - item.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }
  
  /**
   * キャッシュにデータを保存
   * @param key キャッシュキー
   * @param data 保存するデータ
   * @param source データソース（'websocket'または'rest'）
   */
  set<T>(key: string, data: T, source: 'websocket' | 'rest' = 'rest'): void {
    this.cache.set(key, { 
      data, 
      timestamp: Date.now(), 
      source 
    });
  }
  
  /**
   * キャッシュをクリア
   * @param keyPrefix 特定のプレフィックスを持つキーのみ削除する場合に指定
   */
  clear(keyPrefix?: string): void {
    if (keyPrefix) {
      // 特定のプレフィックスを持つキーのみ削除
      for (const key of this.cache.keys()) {
        if (key.startsWith(keyPrefix)) {
          this.cache.delete(key);
          logger.debug(`キャッシュキー削除: ${key}`, {
            component: 'CacheService',
            action: 'clear'
          });
        }
      }
    } else {
      // 全キャッシュをクリア
      this.cache.clear();
      logger.debug('全キャッシュをクリア', {
        component: 'CacheService',
        action: 'clear'
      });
    }
  }
  
  /**
   * キャッシュの統計情報を取得
   * @returns キャッシュの統計情報
   */
  getStats(): CacheStats {
    const stats: CacheStats = {
      totalEntries: this.cache.size,
      entries: []
    };
    
    for (const [key, value] of this.cache.entries()) {
      stats.entries.push({
        key,
        age: Date.now() - value.timestamp,
        size: JSON.stringify(value.data).length
      });
    }
    
    return stats;
  }
}

// シングルトンインスタンスをエクスポート
export const cacheService = new CacheService();
