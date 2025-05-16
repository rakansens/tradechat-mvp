/**
 * hooks/ui/useAutoScroll.ts
 * 作成: スクロール位置管理と表示制御を行うカスタムフック
 * 移動: components/chat/window/hooks/useScrollManagerから移動
 * 更新: 2025-06-25 - 汎用コンポーネントとして移動
 * 更新: 2025-06-26 - IntersectionObserverを使った実装に変更
 * 更新: 2025-06-27 - リンターエラー修正
 */

import { useState, useRef, useCallback, useEffect } from "react";

interface ScrollManagerReturn {
  // refs
  containerRef: React.RefObject<HTMLDivElement>;
  
  // state
  showScrollButton: boolean;
  
  // handlers
  handleScroll: (e?: React.UIEvent<HTMLDivElement>) => void;
  scrollToBottom: () => void;
}

/**
 * スクロール位置を管理し、スクロールボタンの表示状態を制御するフック
 * IntersectionObserverを使用して下端の視認性を監視
 * @returns コンテナref、スクロールボタン表示状態、スクロールハンドラー
 */
export default function useAutoScroll(): ScrollManagerReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  /**
   * スクロール位置変更時のハンドラー
   * IntersectionObserverが未対応の場合のフォールバックとして使用
   */
  const handleScroll = useCallback((e?: React.UIEvent<HTMLDivElement>) => {
    // IntersectionObserverがある場合は不要だが、互換性のため残す
    if (!e || !containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // 下端からの距離を計算
    const bottomThreshold = 150;
    const isNearBottom = scrollHeight - scrollTop - clientHeight <= bottomThreshold;
    setShowScrollButton(!isNearBottom);
  }, []);

  /**
   * IntersectionObserverのセットアップと監視
   */
  useEffect(() => {
    // chatEndRefを使って末尾のダミー要素を生成・マウント
    if (!containerRef.current) return;
    
    if (!chatEndRef.current) {
      const endElement = document.createElement('div');
      endElement.style.height = '1px';
      endElement.style.width = '100%';
      endElement.style.visibility = 'hidden';
      containerRef.current.appendChild(endElement);
      chatEndRef.current = endElement;
    }
    
    // IntersectionObserverの作成
    const options = {
      root: containerRef.current,
      rootMargin: '0px',
      threshold: 0.1 // 少しでも見えたらトリガー
    };
    
    const callback: IntersectionObserverCallback = (entries) => {
      const [entry] = entries;
      setShowScrollButton(!entry.isIntersecting);
    };
    
    try {
      observerRef.current = new IntersectionObserver(callback, options);
      observerRef.current.observe(chatEndRef.current);
    } catch (error) {
      console.warn('IntersectionObserver not supported, falling back to scroll events', error);
      // フォールバック: 初期状態でスクロールボタンを非表示に
      setShowScrollButton(false);
    }
    
    return () => {
      observerRef.current?.disconnect();
      if (chatEndRef.current && containerRef.current && chatEndRef.current.parentNode === containerRef.current) {
        containerRef.current.removeChild(chatEndRef.current);
      }
    };
  }, []);

  /**
   * コンテナを下端までスクロールする
   * スムーススクロールをサポートしていないブラウザ用にフォールバック処理も実装
   */
  const scrollToBottom = useCallback(() => {
    if (!containerRef.current) return;

    try {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth"
      });
    } catch (_error) {
      // フォールバック - エラーは無視
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    }
  }, []);

  return {
    containerRef: containerRef as React.RefObject<HTMLDivElement>,
    showScrollButton,
    handleScroll,
    scrollToBottom
  };
} 