/**
 * services/cache/cacheTypes.ts
 * キャッシュサービスの型定義
 * 
 * 作成: キャッシュサービスのインターフェースと型定義
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  source: 'websocket' | 'rest';
}

export interface CacheStats {
  totalEntries: number;
  entries: Array<{
    key: string;
    age: number;
    size: number;
  }>;
}

export interface ICacheService {
  /**
   * キャッシュからデータを取得
   * @param key キャッシュキー
   * @returns キャッシュされたデータ、または存在しない場合はnull
   */
  get<T>(key: string): T | null;
  
  /**
   * キャッシュにデータを保存
   * @param key キャッシュキー
   * @param data 保存するデータ
   * @param source データソース（'websocket'または'rest'）
   */
  set<T>(key: string, data: T, source?: 'websocket' | 'rest'): void;
  
  /**
   * キャッシュをクリア
   * @param keyPrefix 特定のプレフィックスを持つキーのみ削除する場合に指定
   */
  clear(keyPrefix?: string): void;
  
  /**
   * キャッシュの統計情報を取得
   * @returns キャッシュの統計情報
   */
  getStats(): CacheStats;
}
