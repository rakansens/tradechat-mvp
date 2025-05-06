// hooks/useResizeObserver.ts
// 作成: ResizeObserverの初期化とリソース管理をカプセル化したカスタムフック

"use client"

import { useRef, useEffect, useCallback } from 'react'

type ResizeHandler = (entry: ResizeObserverEntry) => void

export function useResizeObserver<T extends HTMLElement>(
  onResize?: ResizeHandler
) {
  const elementRef = useRef<T | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)
  
  // リサイズ検知のコールバック関数
  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    if (!onResize || entries.length === 0) return
    
    // 対象の要素のResizeObserverEntryを取得
    const entry = entries[0]
    onResize(entry)
  }, [onResize])
  
  // ResizeObserverの初期化と監視開始
  useEffect(() => {
    // 既存のObserverをクリーンアップ
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
    
    // 新しいResizeObserverを作成
    observerRef.current = new ResizeObserver(handleResize)
    
    // 対象要素が存在する場合は監視を開始
    if (elementRef.current) {
      observerRef.current.observe(elementRef.current)
    }
    
    // クリーンアップ関数
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [handleResize])
  
  // setElementメソッド: 監視する要素を設定（refオブジェクトが使えない場合）
  const setElement = useCallback((element: T | null) => {
    // 以前の要素の監視を停止
    if (observerRef.current && elementRef.current) {
      observerRef.current.unobserve(elementRef.current)
    }
    
    // 新しい要素を設定
    elementRef.current = element
    
    // 新しい要素の監視を開始
    if (observerRef.current && element) {
      observerRef.current.observe(element)
    }
  }, [])
  
  return { elementRef, setElement }
}
