'use client';

// components/ui/spinner.tsx
// 作成: ローディング表示用の再利用可能なスピナーコンポーネント

import * as React from 'react';
import { cn } from '@/utils/cn';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ className, size = 'md', ...props }: SpinnerProps) {
  const sizeClass = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-t-transparent',
        sizeClass[size],
        'border-primary',
        className
      )}
      {...props}
    >
      <span className="sr-only">読み込み中...</span>
    </div>
  );
} 