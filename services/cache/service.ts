/**
 * services/cache/service.ts
 * キャッシュサービスの実装
 * 
 * このサービスは、アプリケーション内でのデータキャッシュを管理します。
 * メモリキャッシュを使用し、キーと値のペアを保存します。
 * キャッシュエントリには有効期限とソース情報を付加できます。
 */

import { logger } from '../../utils/common';

// キャッシュエントリの型定義
interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
  source?: 'rest' | 'websocket' | 'memory';
  createdAt: number;
  updatedAt: number;
}

// キャッシュソースの型定義
export type CacheSource = 'rest' | 'websocket' | 'memory';

/**
 * キャッシュサービスクラス
 */
class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 60 * 1000; // デフォルトの有効期限: 60秒
  
  /**
   * キャッシュにデータを保存
   * @param key キャッシュキー
   * @param value 保存する値
   * @param source データソース
   * @param ttl 有効期限（ミリ秒）
   */
  set<T>(key: string, value: T, source?: CacheSource, ttl?: number): void {
    const now = Date.now();
    const expiresAt = ttl ? now + ttl : now + this.defaultTTL;
    
    const entry: CacheEntry<T> = {
      value,
      expiresAt: ttl === 0 ? null : expiresAt, // ttlが0の場合は有効期限なし
      source,
      createdAt: now,
      updatedAt: now
    };
    
    // 既存のエントリがある場合は作成日時を保持
    const existingEntry = this.cache.get(key);
    if (existingEntry) {
      entry.createdAt = existingEntry.createdAt;
    }
    
    this.cache.set(key, entry);
    
    logger.debug(`キャッシュにデータを保存: ${key}`, {
      component: 'CacheService',
      action: 'set',
      key,
      source,
      ttl
    });
  }
  
  /**
   * キャッシュからデータを取得
   * @param key キャッシュキー
   * @returns キャッシュされた値（有効期限切れまたは存在しない場合はnull）
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // 有効期限チェック
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      // 有効期限切れの場合はキャッシュから削除
      this.cache.delete(key);
      
      logger.debug(`キャッシュの有効期限切れ: ${key}`, {
        component: 'CacheService',
        action: 'get',
        key,
        expired: true
      });
      
      return null;
    }
    
    logger.debug(`キャッシュからデータを取得: ${key}`, {
      component: 'CacheService',
      action: 'get',
      key,
      source: entry.source
    });
    
    return entry.value;
  }
  
  /**
   * キャッシュからデータを削除
   * @param key キャッシュキー
   */
  delete(key: string): void {
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      logger.debug(`キャッシュからデータを削除: ${key}`, {
        component: 'CacheService',
        action: 'delete',
        key
      });
    }
  }
  
  /**
   * 正規表現パターンに一致するキーのキャッシュを削除
   * @param pattern 正規表現パターン
   * @returns 削除されたキーの数
   */
  clearByPattern(pattern: RegExp): number {
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      logger.debug(`パターンに一致するキャッシュを削除: ${pattern}`, {
        component: 'CacheService',
        action: 'clearByPattern',
        pattern: pattern.toString(),
        count
      });
    }
    
    return count;
  }
  
  /**
   * キャッシュをすべて削除
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    
    logger.debug(`キャッシュをすべて削除`, {
      component: 'CacheService',
      action: 'clear',
      count: size
    });
  }

  /**
   * サービスをリセット
   * 全キャッシュを削除します
   */
  reset(): void {
    this.clear();
  }
  
  /**
   * キャッシュのサイズを取得
   * @returns キャッシュエントリの数
   */
  size(): number {
    return this.cache.size;
  }
  
  /**
   * キャッシュの統計情報を取得
   * @returns 統計情報
   */
  getStats(): { size: number; sources: Record<string, number>; expired: number } {
    const now = Date.now();
    const sources: Record<string, number> = {};
    let expired = 0;
    
    for (const entry of this.cache.values()) {
      // ソース別のカウント
      const source = entry.source || 'unknown';
      sources[source] = (sources[source] || 0) + 1;
      
      // 有効期限切れのカウント
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        expired++;
      }
    }
    
    return {
      size: this.cache.size,
      sources,
      expired
    };
  }
}

// シングルトンインスタンスをエクスポート
export const cacheService = new CacheService();

/**
 * サービスインスタンスをリセット
 */
export function resetCacheService(): void {
  cacheService.reset();
}
