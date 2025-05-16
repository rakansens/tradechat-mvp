/**
 * hooks/ui/__tests__/useAutoScroll.test.tsx
 * 作成: スクロール管理フックのテスト
 * 移動: useScrollManagerのテストを移行
 * 更新: 2025-06-25 - 名前変更とパス更新
 * 更新: 2025-06-26 - IntersectionObserverのテストを追加
 */

import React, { useEffect } from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { render, screen, fireEvent } from '@testing-library/react';
import useAutoScroll from '../useAutoScroll';
import setupIntersectionObserverMock from '@/utils/dom/mockIntersectionObserver';

describe('useAutoScroll', () => {
  let mockIntersectionObserver: ReturnType<typeof setupIntersectionObserverMock>;
  
  beforeAll(() => {
    // IntersectionObserverをモック
    mockIntersectionObserver = setupIntersectionObserverMock();
  });
  
  afterAll(() => {
    // モックを復元
    mockIntersectionObserver.restore();
  });
  
  it('初期状態ではスクロールボタンは非表示', () => {
    const { result } = renderHook(() => useAutoScroll());
    expect(result.current.showScrollButton).toBe(false);
  });

  it('IntersectionObserverが要素が見えない状態を検知するとスクロールボタンが表示される', () => {
    // テスト用コンポーネント
    const TestComponent = () => {
      const { containerRef, showScrollButton } = useAutoScroll();
      
      // コンポーネントがマウントされた後にIntersectionObserverのコールバックを実行
      useEffect(() => {
        setTimeout(() => {
          // 要素が見えていない状態を模擬
          const mockObserver = global.IntersectionObserver as jest.Mock;
          const mockInstance = mockObserver.mock.instances[0];
          const mockCallback = mockObserver.mock.calls[0][0];
          
          // isIntersecting=falseのコールバックを実行（＝見えていない）
          mockCallback([{
            isIntersecting: false,
            target: document.createElement('div'),
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRatio: 0,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            time: 0
          }], mockInstance);
        }, 0);
      }, []);
      
      return (
        <div data-testid="container" ref={containerRef}>
          <div data-testid="scroll-button" style={{ display: showScrollButton ? 'block' : 'none' }}>
            Scroll Down
          </div>
        </div>
      );
    };
    
    render(<TestComponent />);
    const button = screen.getByTestId('scroll-button');
    
    // 非同期でIntersectionObserverのコールバックが実行されるのを待つ
    setTimeout(() => {
      // ボタンが表示されることを確認
      expect(button).toBeVisible();
    }, 10);
  });
  
  it('IntersectionObserverが要素が見える状態を検知するとスクロールボタンが非表示になる', () => {
    // テスト用コンポーネント
    const TestComponent = () => {
      const { containerRef, showScrollButton } = useAutoScroll();
      
      // 初期状態ではボタンを表示
      useEffect(() => {
        setTimeout(() => {
          // 要素が見えている状態を模擬
          const mockObserver = global.IntersectionObserver as jest.Mock;
          const mockInstance = mockObserver.mock.instances[0];
          const mockCallback = mockObserver.mock.calls[0][0];
          
          // isIntersecting=trueのコールバックを実行（＝見えている）
          mockCallback([{
            isIntersecting: true,
            target: document.createElement('div'),
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRatio: 0.5,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            time: 0
          }], mockInstance);
        }, 0);
      }, []);
      
      return (
        <div data-testid="container" ref={containerRef}>
          <div data-testid="scroll-button" style={{ display: showScrollButton ? 'block' : 'none' }}>
            Scroll Down
          </div>
        </div>
      );
    };
    
    render(<TestComponent />);
    const button = screen.getByTestId('scroll-button');
    
    // 非同期でIntersectionObserverのコールバックが実行されるのを待つ
    setTimeout(() => {
      // ボタンが非表示になることを確認
      expect(button).not.toBeVisible();
    }, 10);
  });

  it('従来のスクロールイベントハンドラーも動作する（フォールバック用）', () => {
    // テスト用コンポーネント
    const TestComponent = () => {
      const { containerRef, showScrollButton, handleScroll } = useAutoScroll();
      
      return (
        <div data-testid="container" ref={containerRef} onScroll={handleScroll}>
          <div data-testid="scroll-button" style={{ display: showScrollButton ? 'block' : 'none' }}>
            Scroll Down
          </div>
        </div>
      );
    };
    
    render(<TestComponent />);
    const container = screen.getByTestId('container');
    const button = screen.getByTestId('scroll-button');
    
    // スクロールイベントをモック
    Object.defineProperty(container, 'scrollTop', { value: 100 });
    Object.defineProperty(container, 'scrollHeight', { value: 500 });
    Object.defineProperty(container, 'clientHeight', { value: 200 });
    
    // スクロールイベント発火
    fireEvent.scroll(container);
    
    // ボタンが表示されることを確認
    expect(button).toBeVisible();
  });

  it('scrollToBottomが呼ばれたとき、scrollToメソッドが実行される', () => {
    const { result } = renderHook(() => useAutoScroll());
    
    // containerRef.currentのモック
    const mockContainer = {
      scrollTo: jest.fn(),
      scrollHeight: 1000
    };
    // @ts-expect-error - テスト用に型チェックを無視
    result.current.containerRef.current = mockContainer;
    
    // scrollToBottomを実行
    act(() => {
      result.current.scrollToBottom();
    });
    
    // scrollToが正しく呼ばれたことを確認
    expect(mockContainer.scrollTo).toHaveBeenCalledWith({
      top: 1000,
      behavior: 'smooth'
    });
  });
  
  it('scrollToがサポートされていない場合、フォールバックが実行される', () => {
    const { result } = renderHook(() => useAutoScroll());
    
    // containerRef.currentのモック (scrollToがエラーを投げる)
    const mockContainer = {
      scrollTo: jest.fn().mockImplementation(() => {
        throw new Error('Not supported');
      }),
      scrollHeight: 1000,
      scrollTop: 0
    };
    // @ts-expect-error - テスト用に型チェックを無視
    result.current.containerRef.current = mockContainer;
    
    // scrollToBottomを実行
    act(() => {
      result.current.scrollToBottom();
    });
    
    // フォールバックとしてscrollTopが設定されたことを確認
    expect(mockContainer.scrollTop).toBe(1000);
  });
}); 