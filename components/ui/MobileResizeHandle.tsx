// components/ui/MobileResizeHandle.tsx
// 作成: モバイル表示用のリサイズハンドルコンポーネント

"use client"

import React, { useRef, useCallback, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { theme } from "@/styles/colors"

interface MobileResizeHandleProps {
  className?: string
  onResize: (topHeight: number, bottomHeight: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
  minTopHeight?: number
  minBottomHeight?: number
}

export function MobileResizeHandle({
  className,
  onResize,
  containerRef,
  minTopHeight = 100,
  minBottomHeight = 100,
}: MobileResizeHandleProps) {
  const handleRef = useRef<HTMLDivElement>(null)
  const startPositionRef = useRef(0)
  const topHeightRef = useRef(0)
  const containerHeightRef = useRef(0)
  const isDraggingRef = useRef(false)
  const [isDragging, setIsDragging] = useState(false)

  const updateLayout = useCallback(
    (clientY: number) => {
      if (!containerRef.current) return

      const containerHeight = containerRef.current.clientHeight
      const containerRect = containerRef.current.getBoundingClientRect()
      const containerTop = containerRect.top

      // ドラッグ位置に基づいて新しい高さを計算
      let newTopHeight = clientY - containerTop
      let newBottomHeight = containerHeight - newTopHeight

      // 最小高さの制約を適用
      if (newTopHeight < minTopHeight) {
        newTopHeight = minTopHeight
        newBottomHeight = containerHeight - newTopHeight
      } else if (newBottomHeight < minBottomHeight) {
        newBottomHeight = minBottomHeight
        newTopHeight = containerHeight - newBottomHeight
      }

      // 上部と下部の要素の高さを更新
      const topElement = containerRef.current.firstElementChild as HTMLElement
      const bottomElement = containerRef.current.lastElementChild as HTMLElement
      
      if (topElement && bottomElement) {
        topElement.style.height = `${newTopHeight}px`
        bottomElement.style.height = `${newBottomHeight}px`
        
        // スクロール位置を更新
        topElement.scrollTop = topElement.scrollHeight
        
        // コールバックを呼び出して親コンポーネントに通知
        onResize(newTopHeight, newBottomHeight)
      }
    },
    [containerRef, minTopHeight, minBottomHeight, onResize]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      if (!containerRef.current) return
      
      startPositionRef.current = e.clientY
      topHeightRef.current = (containerRef.current.firstElementChild as HTMLElement)?.clientHeight || 0
      containerHeightRef.current = containerRef.current.clientHeight
      isDraggingRef.current = true
      setIsDragging(true)
      
      // キャプチャを設定
      handleRef.current?.setPointerCapture(e.pointerId)
    },
    [containerRef]
  )

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDraggingRef.current) return
      updateLayout(e.clientY)
    },
    [updateLayout]
  )

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      setIsDragging(false)
      
      // キャプチャを解放
      handleRef.current?.releasePointerCapture(e.pointerId)
      
      // 最終位置を更新
      updateLayout(e.clientY)
    },
    [updateLayout]
  )

  useEffect(() => {
    const handleElement = handleRef.current
    
    if (handleElement) {
      handleElement.addEventListener('pointermove', handlePointerMove)
      handleElement.addEventListener('pointerup', handlePointerUp)
      handleElement.addEventListener('pointercancel', handlePointerUp)
    }
    
    return () => {
      if (handleElement) {
        handleElement.removeEventListener('pointermove', handlePointerMove)
        handleElement.removeEventListener('pointerup', handlePointerUp)
        handleElement.removeEventListener('pointercancel', handlePointerUp)
      }
    }
  }, [handlePointerMove, handlePointerUp])

  return (
    <div
      ref={handleRef}
      className={cn(
        "resize-handle cursor-row-resize",
        isDragging && "active",
        className
      )}
      style={{ 
        height: '8px',
        backgroundColor: isDragging 
          ? `${theme.background.elevated}` 
          : `${theme.background.tertiary}`,
      }}
      onPointerDown={handlePointerDown}
      aria-hidden="true"
    />
  )
}
