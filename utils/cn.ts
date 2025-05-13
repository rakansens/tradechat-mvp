// utils/cn.ts
// 作成: クラス名を結合するユーティリティ関数

import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

/**
 * クラス名を結合するユーティリティ関数
 * clsxで条件付きクラスを結合し、tailwind-mergeで重複を解決します
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 