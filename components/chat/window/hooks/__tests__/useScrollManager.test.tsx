/**
 * components/chat/window/hooks/__tests__/useScrollManager.test.tsx
 * 作成: スクロール管理フックのテスト
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { render, screen, fireEvent } from '@testing-library/react';
import useScrollManager from '../useScrollManager';

describe('useScrollManager', () => {
  it('初期状態ではスクロールボタンは非表示', () => {
    const { result } = renderHook(() => useScrollManager());
    expect(result.current.showScrollButton).toBe(false);
  });

  it('下端から離れるとスクロールボタンが表示される', () => {
    // テスト用コンポーネント
    const TestComponent = () => {
      const { containerRef, showScrollButton, handleScroll } = useScrollManager();
      
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
    const { result } = renderHook(() => useScrollManager());
    
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
    const { result } = renderHook(() => useScrollManager());
    
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