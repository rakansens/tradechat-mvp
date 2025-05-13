/**
 * hooks/chart/layout/useLayoutState.ts
 * 
 * レイアウト状態管理のためのカスタムフック
 * リサイズ状態管理とローカルストレージ保存を共通化
 * 
 * 変更履歴:
 * - 2023-05-01: 初期実装
 * - 2023-07-10: 無限ループの修正とパフォーマンス最適化
 * - 2025-05-15: フックのリファクタリングに伴いhooks/chart/layoutディレクトリに移動
 */

"use client"

import { useState, useEffect, useCallback, useRef } from 'react'

export interface LayoutOptions {
  storageKey?: string
  defaultSizes?: number[]
  minSizes?: number[]
  direction?: 'horizontal' | 'vertical'
}

export function useLayoutState({
  storageKey = 'panelSizes',
  defaultSizes = [30, 70],
  minSizes = [20, 30],
  direction = 'horizontal'
}: LayoutOptions = {}) {
  // defaultSizesの参照を保持するためのuseRef
  const defaultSizesRef = useRef(defaultSizes)
  const [sizes, setSizes] = useState<number[]>(defaultSizes)
  const [initialSizes, setInitialSizes] = useState<number[]>(defaultSizes)

  // ローカルストレージからサイズを復元
  useEffect(() => {
    // 初期化時にローカルストレージから読み込み、なければデフォルト値を使用
    try {
      const savedSizes = localStorage.getItem(storageKey)
      if (savedSizes) {
        const parsedSizes = JSON.parse(savedSizes)
        // 有効なサイズであることを確認
        if (Array.isArray(parsedSizes) && 
            parsedSizes.length === defaultSizesRef.current.length && 
            parsedSizes.every(size => typeof size === 'number')) {
          setSizes(parsedSizes)
          setInitialSizes(parsedSizes)
        }
      }
    } catch (error) {
      console.error('Error loading layout sizes:', error)
    }
    // storageKeyのみに依存させ、無限ループを防止
  }, [storageKey])

  // レイアウト変更ハンドラー
  const handleLayoutChange = useCallback((newSizes: number[]) => {
    setSizes(newSizes)
    try {
      // ローカルストレージにサイズを保存
      localStorage.setItem(storageKey, JSON.stringify(newSizes))
    } catch (error) {
      console.error('Error saving layout sizes:', error)
    }
  }, [storageKey])

  // レイアウトをリセット
  const resetLayout = useCallback(() => {
    setSizes(defaultSizes)
    try {
      localStorage.setItem(storageKey, JSON.stringify(defaultSizes))
    } catch (error) {
      console.error('Error resetting layout sizes:', error)
    }
  }, [storageKey, defaultSizes])

  return {
    sizes,
    initialSizes,
    handleLayoutChange,
    resetLayout,
    minSizes,
    direction
  }
} 