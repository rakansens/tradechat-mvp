// components/ui/BaseResizeHandle.tsx
// 更新: リサイズハンドルの基本スタイルと動作を統一するベースコンポーネント
// forwardRefパターンを使用してrefを正しく扱えるようにしました

"use client"

import React, { forwardRef } from "react"
import { cn } from "@/lib/utils"

export interface BaseResizeHandleProps {
  className?: string
  direction?: "horizontal" | "vertical"
  isActive?: boolean
  id?: string
}

export const BaseResizeHandle = forwardRef<
  HTMLDivElement,
  BaseResizeHandleProps & React.HTMLAttributes<HTMLDivElement>
>((
  {
    className,
    direction = "horizontal", 
    isActive = false,
    id,
    ...props
  }, 
  ref
) => {
  const directionClass = direction === "horizontal" ? "cursor-col-resize" : "cursor-row-resize"
  
  return (
    <div
      ref={ref}
      id={id}
      className={cn(
        "resize-handle",
        directionClass,
        isActive && "active",
        direction === "vertical" && "flex-col",
        className
      )}
      style={{ 
        backgroundColor: isActive 
          ? 'var(--color-bg-elevated)' 
          : 'var(--color-bg-tertiary)',
        // デフォルトの寸法
        ...(direction === "horizontal" 
          ? { width: '8px', height: '100%' } 
          : { width: '100%', height: '8px' })
      }}
      aria-hidden="true"
      {...props}
    />
  )
});

BaseResizeHandle.displayName = "BaseResizeHandle";
