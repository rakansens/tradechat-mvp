// components/chat/ui/MemoryToggle.tsx
// メモリパネルトグルボタンコンポーネント
// 作成日: 2025/5/31
// 更新日: 2025/5/31 - スタイルを改善し、視覚的により目立たせる

import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MemoryToggleProps {
  onClick: () => void;
  isOpen: boolean;
  className?: string;
}

/**
 * メモリパネルトグルボタン
 */
export function MemoryToggle({ onClick, isOpen, className = "" }: MemoryToggleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isOpen ? "default" : "ghost"}
            size="sm"
            onClick={onClick}
            className={`h-8 rounded-full transition-all ${isOpen ? 'bg-primary text-primary-foreground' : 'hover:bg-primary/10'} ${className}`}
            aria-label="メモリパネルを開く"
          >
            <Brain className={`h-4 w-4 ${isOpen ? 'animate-pulse' : ''}`} />
            <span className={`ml-1 text-xs ${isOpen ? '' : 'hidden sm:inline'}`}>メモリ</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>チャット履歴メモリ</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 