/**
 * components/chat/window/ui/TypingIndicator.tsx
 * タイピング中を表示するアニメーションインジケーター
 */

import { memo } from "react";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  className?: string;
}

export const TypingIndicator = memo(({ className }: TypingIndicatorProps) => {
  return (
    <div className={cn("flex items-center space-x-1", className)}>
      <span className="text-sm text-muted-foreground">思考中</span>
      <div className="flex space-x-1">
        {[1, 2, 3].map((dot) => (
          <span
            key={dot}
            className={cn(
              "h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse",
              `animation-delay-${dot * 100}`
            )}
            style={{
              animationDelay: `${dot * 150}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
});

TypingIndicator.displayName = "TypingIndicator"; 