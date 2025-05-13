/**
 * components/chat/window/hooks/useScrollManager.ts
 * 作成: スクロール位置管理と表示制御を行うカスタムフック
 */

import { useState, useRef, useCallback } from "react";

interface ScrollManagerReturn {
  // refs
  containerRef: React.RefObject<HTMLDivElement>;
  
  // state
  showScrollButton: boolean;
  
  // handlers
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  scrollToBottom: () => void;
}

/**
 * スクロール位置を管理し、スクロールボタンの表示状態を制御するフック
 * @returns コンテナref、スクロールボタン表示状態、スクロールハンドラー
 */
export default function useScrollManager(): ScrollManagerReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  /**
   * スクロール位置変更時のハンドラー
   * 下端からの距離によってスクロールボタン表示を切り替え
   */
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // 下端からの距離を計算
    const bottomThreshold = 150;
    const isNearBottom = scrollHeight - scrollTop - clientHeight <= bottomThreshold;
    setShowScrollButton(!isNearBottom);
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
    containerRef,
    showScrollButton,
    handleScroll,
    scrollToBottom
  };
} 