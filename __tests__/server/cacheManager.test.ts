/**
 * __tests__/server/cacheManager.test.ts
 * キャッシュマネージャーのテスト実装
 * 
 * LRUキャッシュの機能をテスト
 * - キャッシュの設定と取得
 * - TTL（有効期限）の動作確認
 * - LRU（Least Recently Used）アルゴリズムの動作確認
 * - キャッシュ統計情報の取得
 * - クリーンアップ機能のテスト
 */

import { LRUCache, cacheManager } from '../../server/cacheManager';

// 時間をモック化するためのヘルパー関数
const advanceTime = (ms: number) => {
  const originalNow = Date.now;
  const mockTime = originalNow() + ms;
  
  // Date.nowをモック化
  global.Date.now = jest.fn(() => mockTime);
  
  return () => {
    global.Date.now = originalNow;
  };
};

describe('LRUCache', () => {
  let cache: LRUCache<any>;
  
  beforeEach(() => {
    // 各テスト前にキャッシュを初期化
    cache = new LRUCache<any>(3, 1000); // 最大サイズ3、TTL 1秒
  });
  
  afterEach(() => {
    // Date.nowのモックをリセット
    jest.restoreAllMocks();
  });
  
  describe('基本的な操作', () => {
    it('キャッシュにデータを設定して取得できること', () => {
      // キャッシュにデータを設定
      cache.set('key1', 'value1');
      
      // キャッシュからデータを取得
      const value = cache.get('key1');
      
      // 検証
      expect(value).toBe('value1');
    });
    
    it('存在しないキーはnullを返すこと', () => {
      // 存在しないキーを取得
      const value = cache.get('nonexistent');
      
      // 検証
      expect(value).toBeNull();
    });
    
    it('キーの存在確認ができること', () => {
      // キャッシュにデータを設定
      cache.set('key1', 'value1');
      
      // キーの存在確認
      const exists = cache.has('key1');
      const notExists = cache.has('nonexistent');
      
      // 検証
      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });
    
    it('キーを削除できること', () => {
      // キャッシュにデータを設定
      cache.set('key1', 'value1');
      
      // キーを削除
      const result = cache.delete('key1');
      
      // 検証
      expect(result).toBe(true);
      expect(cache.has('key1')).toBe(false);
    });
    
    it('キャッシュをクリアできること', () => {
      // キャッシュにデータを設定
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      // キャッシュをクリア
      cache.clear();
      
      // 検証
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });
  });
  
  describe('TTL（有効期限）', () => {
    it('TTLを超えたエントリはnullを返すこと', () => {
      // キャッシュにデータを設定
      cache.set('key1', 'value1');
      
      // 時間を進める（TTLを超える）
      const restoreTime = advanceTime(1500); // 1.5秒進める
      
      try {
        // キャッシュからデータを取得
        const value = cache.get('key1');
        
        // 検証
        expect(value).toBeNull();
      } finally {
        // 時間を元に戻す
        restoreTime();
      }
    });
    
    it('TTL内のエントリは正常に取得できること', () => {
      // キャッシュにデータを設定
      cache.set('key1', 'value1');
      
      // 時間を進める（TTL内）
      const restoreTime = advanceTime(500); // 0.5秒進める
      
      try {
        // キャッシュからデータを取得
        const value = cache.get('key1');
        
        // 検証
        expect(value).toBe('value1');
      } finally {
        // 時間を元に戻す
        restoreTime();
      }
    });
    
    it('has()メソッドもTTLを考慮すること', () => {
      // キャッシュにデータを設定
      cache.set('key1', 'value1');
      
      // 時間を進める（TTLを超える）
      const restoreTime = advanceTime(1500); // 1.5秒進める
      
      try {
        // キーの存在確認
        const exists = cache.has('key1');
        
        // 検証
        expect(exists).toBe(false);
      } finally {
        // 時間を元に戻す
        restoreTime();
      }
    });
  });
  
  describe('LRU（Least Recently Used）アルゴリズム', () => {
    it('キャッシュサイズを超えた場合、最も古いエントリが削除されること', () => {
      // キャッシュにデータを設定（最大サイズは3）
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // すべてのキーが存在することを確認
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      
      // 4つ目のエントリを追加（最も古いkey1が削除されるはず）
      cache.set('key4', 'value4');
      
      // 検証
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });
    
    it('アクセスされたエントリは「最近使用された」とみなされること', () => {
      // キャッシュにデータを設定
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      // key1にアクセスして「最近使用された」状態にする
      cache.get('key1');
      
      // 4つ目のエントリを追加（最も古いkey2が削除されるはず）
      cache.set('key4', 'value4');
      
      // 検証
      expect(cache.has('key1')).toBe(true); // アクセスしたので残っている
      expect(cache.has('key2')).toBe(false); // 最も古いので削除された
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });
  });
  
  describe('統計情報', () => {
    it('キャッシュの統計情報を取得できること', () => {
      // キャッシュにデータを設定
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      // いくつかのアクセスを行う
      cache.get('key1'); // ヒット
      cache.get('nonexistent'); // ミス
      
      // 統計情報を取得
      const stats = cache.getStats();
      
      // 検証
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(3);
      expect(stats.hitCount).toBe(1);
      expect(stats.missCount).toBe(1);
      expect(stats.evictionCount).toBe(0);
      expect(stats.entries.length).toBe(2);
    });
  });
  
  describe('クリーンアップ', () => {
    it('期限切れのエントリをクリーンアップできること', () => {
      // キャッシュにデータを設定
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      // 時間を進める（TTLを超える）
      const restoreTime = advanceTime(1500); // 1.5秒進める
      
      try {
        // クリーンアップを実行
        const cleanedCount = cache.cleanup();
        
        // 検証
        expect(cleanedCount).toBe(2); // 2つのエントリがクリーンアップされた
        expect(cache.has('key1')).toBe(false);
        expect(cache.has('key2')).toBe(false);
      } finally {
        // 時間を元に戻す
        restoreTime();
      }
    });
  });
});

describe('cacheManager', () => {
  beforeEach(() => {
    // 各テスト前にキャッシュをクリア
    cacheManager.clearAll();
  });
  
  afterEach(() => {
    // Date.nowのモックをリセット
    jest.restoreAllMocks();
  });
  
  it('オーダーブックキャッシュを使用できること', () => {
    // オーダーブックキャッシュにデータを設定
    cacheManager.orderBook.set('BTCUSDT', { asks: [], bids: [] });
    
    // データを取得
    const data = cacheManager.orderBook.get('BTCUSDT');
    
    // 検証
    expect(data).toEqual({ asks: [], bids: [] });
  });
  
  it('ローソク足キャッシュを使用できること', () => {
    // ローソク足キャッシュにデータを設定
    cacheManager.kline.set('BTCUSDT:1m', [{ time: 1620000000000, open: 50000, high: 50100, low: 49900, close: 50050, volume: 10.5 }]);
    
    // データを取得
    const data = cacheManager.kline.get('BTCUSDT:1m');
    
    // 検証
    expect(data).toEqual([{ time: 1620000000000, open: 50000, high: 50100, low: 49900, close: 50050, volume: 10.5 }]);
  });
  
  it('取引キャッシュを使用できること', () => {
    // 取引キャッシュにデータを設定
    cacheManager.trade.set('BTCUSDT', [{ id: '1', price: 50000, amount: 1.5, side: 'buy', timestamp: 1620000000000 }]);
    
    // データを取得
    const data = cacheManager.trade.get('BTCUSDT');
    
    // 検証
    expect(data).toEqual([{ id: '1', price: 50000, amount: 1.5, side: 'buy', timestamp: 1620000000000 }]);
  });
  
  it('すべてのキャッシュをクリアできること', () => {
    // 各キャッシュにデータを設定
    cacheManager.orderBook.set('BTCUSDT', { asks: [], bids: [] });
    cacheManager.kline.set('BTCUSDT:1m', []);
    cacheManager.trade.set('BTCUSDT', []);
    
    // すべてのキャッシュをクリア
    cacheManager.clearAll();
    
    // 検証
    expect(cacheManager.orderBook.has('BTCUSDT')).toBe(false);
    expect(cacheManager.kline.has('BTCUSDT:1m')).toBe(false);
    expect(cacheManager.trade.has('BTCUSDT')).toBe(false);
  });
  
  it('すべてのキャッシュの統計情報を取得できること', () => {
    // 各キャッシュにデータを設定
    cacheManager.orderBook.set('BTCUSDT', { asks: [], bids: [] });
    cacheManager.kline.set('BTCUSDT:1m', []);
    
    // 統計情報を取得
    const stats = cacheManager.getAllStats();
    
    // 検証
    expect(stats).toHaveProperty('orderBook');
    expect(stats).toHaveProperty('kline');
    expect(stats).toHaveProperty('trade');
    expect(stats.orderBook.size).toBe(1);
    expect(stats.kline.size).toBe(1);
    expect(stats.trade.size).toBe(0);
  });
  
  it('すべてのキャッシュをクリーンアップできること', () => {
    // 各キャッシュにデータを設定
    cacheManager.orderBook.set('BTCUSDT', { asks: [], bids: [] });
    cacheManager.kline.set('BTCUSDT:1m', []);
    
    // 時間を進める（TTLを超える）
    const restoreTime = advanceTime(60000); // 60秒進める
    
    try {
      // クリーンアップを実行
      const cleanedCounts = cacheManager.cleanupAll();
      
      // 検証
      expect(cleanedCounts.orderBook).toBe(1);
      expect(cleanedCounts.kline).toBe(1);
      expect(cleanedCounts.trade).toBe(0);
    } finally {
      // 時間を元に戻す
      restoreTime();
    }
  });
});