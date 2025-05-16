/**
 * utils/dom/mockIntersectionObserver.ts
 * 作成: 2025-06-26 - IntersectionObserverのモック実装
 * 
 * Jestテスト環境でIntersectionObserverをモックするためのユーティリティ
 * useAutoScrollなどのテストで使用
 */

export interface MockIntersectionObserverInit {
  root?: Element | Document | null;
  rootMargin?: string;
  threshold?: number | number[];
}

export interface MockIntersectionObserverEntry {
  time: number;
  target: Element;
  boundingClientRect: DOMRectReadOnly;
  rootBounds: DOMRectReadOnly | null;
  intersectionRect: DOMRectReadOnly;
  intersectionRatio: number;
  isIntersecting: boolean;
}

export class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;
  
  private observers: Map<Element, (entries: IntersectionObserverEntry[]) => void> = new Map();
  private elements: Set<Element> = new Set();
  
  constructor(
    private callback: IntersectionObserverCallback,
    private options: MockIntersectionObserverInit = {}
  ) {
    this.root = options.root || null;
    this.rootMargin = options.rootMargin || '0px';
    this.thresholds = Array.isArray(options.threshold) 
      ? options.threshold 
      : [options.threshold || 0];
  }
  
  observe(target: Element): void {
    this.elements.add(target);
  }
  
  unobserve(target: Element): void {
    this.elements.delete(target);
  }
  
  disconnect(): void {
    this.elements.clear();
  }
  
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  
  /**
   * テスト用: 監視対象要素の交差状態を強制的に変更
   * @param isIntersecting 交差しているかどうか
   */
  triggerIntersection(isIntersecting: boolean): void {
    if (this.elements.size === 0) return;
    
    const entries: IntersectionObserverEntry[] = Array.from(this.elements).map(target => ({
      time: Date.now(),
      target,
      boundingClientRect: new DOMRect(0, 0, 100, 100),
      rootBounds: this.root 
        ? new DOMRect(0, 0, 500, 500) 
        : null,
      intersectionRect: isIntersecting 
        ? new DOMRect(0, 0, 50, 50)
        : new DOMRect(0, 0, 0, 0),
      intersectionRatio: isIntersecting ? 0.5 : 0,
      isIntersecting
    } as IntersectionObserverEntry));
    
    this.callback(entries, this);
  }
}

/**
 * テスト環境でIntersectionObserverをモックする
 * テストファイルのsetupで呼び出す
 * 
 * 使用例:
 * beforeAll(() => {
 *   const mockIO = setupIntersectionObserverMock();
 *   // mockIO.triggerIntersection(true) でイベント発火可能
 * });
 */
export function setupIntersectionObserverMock() {
  const mockInstance = new MockIntersectionObserver(() => {});
  
  // グローバルオブジェクトにモックを設定
  const originalIntersectionObserver = global.IntersectionObserver;
  global.IntersectionObserver = jest.fn().mockImplementation(
    (callback, options) => {
      const instance = new MockIntersectionObserver(callback, options);
      return instance;
    }
  );
  
  return {
    mockInstance,
    restore: () => {
      global.IntersectionObserver = originalIntersectionObserver;
    },
    triggerIntersection: (isIntersecting: boolean) => {
      mockInstance.triggerIntersection(isIntersecting);
    }
  };
}

export default setupIntersectionObserverMock; 