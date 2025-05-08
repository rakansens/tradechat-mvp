/**
 * server/cacheManager.ts
 * LRUキャッシュ管理を実装したキャッシュマネージャー
 */

// キャッシュエントリの型定義
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  lastAccessed: number;
}

// キャッシュ統計情報の型定義
export interface CacheStats {
  size: number;
  maxSize: number;
  hitCount: number;
  missCount: number;
  evictionCount: number;
  averageAge: number;
  oldestEntryAge: number;
  entries: Array<{
    key: string;
    age: number;
    lastAccessed: number;
    size: number;
  }>;
}

/**
 * LRUキャッシュマネージャークラス
 * 
 * 最近最も使われていないアイテムを削除するLRU（Least Recently Used）アルゴリズムを実装したキャッシュ
 */
export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private ttl: number;
  private hitCount: number = 0;
  private missCount: number = 0;
  private evictionCount: number = 0;
  private sequence: number = 0; // アクセス順を追跡するためのシーケンスカウンタ

  /**
   * LRUキャッシュを初期化
   * 
   * @param maxSize キャッシュの最大サイズ（エントリ数）
   * @param ttl キャッシュエントリの有効期限（ミリ秒）
   */
  constructor(maxSize: number = 100, ttl: number = 60000) {
    this.cache = new Map<string, CacheEntry<T>>();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * キャッシュにデータを設定
   * 
   * @param key キャッシュキー
   * @param value 保存する値
   * @returns 設定された値
   */
  set(key: string, value: T): T {
    const now = Date.now();
    
    // キャッシュが最大サイズに達した場合、最も古いエントリを削除
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }
    
    // キャッシュにエントリを追加または更新
    this.cache.set(key, {
      value,
      timestamp: now,
      lastAccessed: ++this.sequence // シーケンスカウンタを使用
    });
    
    return value;
  }

  /**
   * キャッシュからデータを取得
   *
   * @param key キャッシュキー
   * @returns 取得した値、存在しない場合はnull
   */
  /**
   * エントリのlastAccessedを更新する内部メソッド
   * シーケンスカウンタを使用して一意のアクセス順序を保証する
   */
  private touch(entry: CacheEntry<T>): void {
    entry.lastAccessed = ++this.sequence;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    const now = Date.now();
    
    // エントリが存在しない場合
    if (!entry) {
      this.missCount++;
      return null;
    }
    
    // エントリが期限切れの場合
    if (now - entry.timestamp >= this.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }
    
    // アクセス順序を更新
    entry.lastAccessed = ++this.sequence;
    this.hitCount++;
    
    // キーを一度削除してから再設定することで、LRU順序を更新
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.value;
  }

  /**
   * キャッシュにキーが存在するか確認
   *
   * @param key キャッシュキー
   * @returns 存在する場合はtrue、存在しない場合はfalse
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    const now = Date.now();
    
    // エントリが存在しない場合
    if (!entry) {
      return false;
    }
    
    // エントリが期限切れの場合
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    // アクセス順序を更新
    entry.lastAccessed = ++this.sequence;
    
    // キーを一度削除してから再設定することで、Mapの挿入順序を更新
    // これによりこのエントリが最新のエントリとしてMapの最後に移動する
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return true;
  }

  /**
   * キャッシュからキーを削除
   * 
   * @param key キャッシュキー
   * @returns 削除に成功した場合はtrue、存在しない場合はfalse
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * キャッシュをクリア
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 最も古いエントリを削除
   * LRUアルゴリズムに基づいて、最も長い間アクセスされていないエントリを削除
   *
   * @returns 削除されたエントリのキー、削除されなかった場合はnull
   */
  private evictOldest(): string | null {
    if (this.cache.size === 0) {
      return null;
    }
    
    let oldestKey: string | null = null;
    let minSequence = Infinity;
    
    // すべてのエントリをループして、最も小さいシーケンス番号を持つエントリを見つける
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < minSequence) {
        minSequence = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    // 最も古いエントリを削除
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.evictionCount++;
      return oldestKey;
    }
    
    return null;
  }

  /**
   * 期限切れのエントリをクリーンアップ
   * 
   * @returns クリーンアップされたエントリの数
   */
  cleanup(): number {
    const now = Date.now();
    let cleanedCount = 0;
    
    // 期限切れのエントリを削除するために配列に一時保存
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= this.ttl) {
        expiredKeys.push(key);
      }
    }
    
    // 期限切れのエントリを削除
    for (const key of expiredKeys) {
      this.cache.delete(key);
      cleanedCount++;
    }
    
    return cleanedCount;
  }

  /**
   * キャッシュの統計情報を取得
   * 
   * @returns キャッシュの統計情報
   */
  getStats(): CacheStats {
    const now = Date.now();
    let totalAge = 0;
    let oldestAge = 0;
    const entries: Array<{
      key: string;
      age: number;
      lastAccessed: number;
      size: number;
    }> = [];
    
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      totalAge += age;
      oldestAge = Math.max(oldestAge, age);
      
      entries.push({
        key,
        age,
        lastAccessed: now - entry.lastAccessed,
        size: JSON.stringify(entry.value).length
      });
    }
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      evictionCount: this.evictionCount,
      averageAge: this.cache.size > 0 ? totalAge / this.cache.size : 0,
      oldestEntryAge: oldestAge,
      entries
    };
  }
}

// シングルトンインスタンスを作成
const orderBookCache = new LRUCache<any>(100, 30000); // 30秒TTL
const klineCache = new LRUCache<any>(100, 60000); // 60秒TTL
const tradeCache = new LRUCache<any>(100, 15000); // 15秒TTL

// キャッシュマネージャーをエクスポート
export const cacheManager = {
  orderBook: orderBookCache,
  kline: klineCache,
  trade: tradeCache,
  
  /**
   * すべてのキャッシュをクリア
   */
  clearAll(): void {
    orderBookCache.clear();
    klineCache.clear();
    tradeCache.clear();
  },
  
  /**
   * すべてのキャッシュの統計情報を取得
   */
  getAllStats(): Record<string, CacheStats> {
    return {
      orderBook: orderBookCache.getStats(),
      kline: klineCache.getStats(),
      trade: tradeCache.getStats()
    };
  },
  
  /**
   * すべてのキャッシュをクリーンアップ
   *
   * 各キャッシュのcleanup()メソッドを呼び出し、その結果を返す
   * cleanup()メソッドは期限切れのエントリを削除し、削除されたエントリ数を返す
   */
  cleanupAll(): Record<string, number> {
    return {
      orderBook: orderBookCache.cleanup(),
      kline: klineCache.cleanup(),
      trade: tradeCache.cleanup()
    };
  }
};

export default cacheManager;