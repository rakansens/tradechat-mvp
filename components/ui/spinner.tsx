/**
 * componen@/components/ui/spinner.tsx
 * ローディング状態を表示するスピナーコンポーネント
 */

import React from 'react';
import { Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'accent' | 'muted';
}

/**
 * ローディング中に表示するスピナーコンポーネント
 * @param className - 追加のCSSクラス
 * @param size - スピナーのサイズ
 * @param color - スピナーの色
 */
export function Spinner({ 
  className, 
  size = 'md', 
  color = 'primary' 
}: SpinnerProps) {
  // サイズに基づいたクラス
  const sizeClass = {
    'sm': 'w-4 h-4',
    'md': 'w-6 h-6',
    'lg': 'w-8 h-8'
  }[size];
  
  // 色に基づいたクラス
  const colorClass = {
    'primary': 'text-primary',
    'secondary': 'text-secondary',
    'accent': 'text-accent',
    'muted': 'text-muted-foreground'
  }[color];
  
  return (
    <Loader 
      className={cn(
        'animate-spin', 
        sizeClass, 
        colorClass, 
        className
      )} 
    />
  );
}

export default Spinner; 