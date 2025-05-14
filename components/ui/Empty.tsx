// components/ui/Empty.tsx
// 空の状態表示コンポーネント
// 作成日: 2025/5/31

import React from "react";
import { cn } from "@/lib/utils";
import { FileX } from "lucide-react";

interface EmptyProps {
  message?: string;
  className?: string;
  iconClassName?: string;
  icon?: React.ReactNode;
}

/**
 * データがない場合の表示コンポーネント
 */
export function Empty({
  message = "データがありません",
  className,
  iconClassName,
  icon,
}: EmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center h-48 p-4",
        className
      )}
    >
      <div className={cn("text-muted-foreground", iconClassName)}>
        {icon || <FileX className="h-12 w-12 mb-2 opacity-50" />}
      </div>
      <p className="text-sm text-muted-foreground mt-2">{message}</p>
    </div>
  );
} 