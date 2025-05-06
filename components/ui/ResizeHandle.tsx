// components/ui/ResizeHandle.tsx
// 更新: BaseResizeHandleを利用してリサイズハンドル機能を提供

import React, { useState } from "react";
import { PanelResizeHandle } from "react-resizable-panels";
import { BaseResizeHandle } from "./BaseResizeHandle";

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
  const [isResizing, setIsResizing] = useState(false);

  return (
    <PanelResizeHandle
      id={id}
      onDragging={setIsResizing}
      className={className}
      {...props}
    >
      <BaseResizeHandle
        direction={direction}
        isActive={isResizing}
      />
    </PanelResizeHandle>
  );
}
