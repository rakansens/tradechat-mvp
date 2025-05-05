// components/ui/ResizeHandle.tsx
// 作成: チャートとチャットの境界線でリサイズ操作を提供するコンポーネント

import React from "react";
import { PanelResizeHandle } from "react-resizable-panels";
import { cn } from "@/lib/utils";

interface ResizeHandleProps {
  className?: string;
  id?: string;
  direction?: "horizontal" | "vertical";
}

export function ResizeHandle({
  className,
  id,
  direction = "horizontal",
  ...props
}: ResizeHandleProps) {
  return (
    <PanelResizeHandle
      id={id}
      className={cn(
        "resize-handle",
        direction === "vertical" && "flex-col",
        className
      )}
    />
  );
}
