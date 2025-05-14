// components/ui/LoadingSpinner.tsx
// ローディングスピナーコンポーネント
// 作成日: 2025/5/31

import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * ローディングスピナーコンポーネント
 */
export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  const sizeClass = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizeClass[size],
        className
      )}
    >
      <span className="sr-only">読み込み中...</span>
    </div>
  );
} 