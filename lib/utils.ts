import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * シンボル正規化関数
 * シンボル文字列を一貫した形式に変換します
 * 例: "BTC/USDT" -> "BTCUSDT", ""BTCUSDT"" -> "BTCUSDT"
 * 
 * @param symbol 正規化するシンボル文字列
 * @returns 正規化されたシンボル文字列
 */
export function normalizeSymbol(symbol: string): string {
  if (!symbol) return '';
  
  // スラッシュとダブルクォーテーションを削除し、大文字に変換
  return symbol.replace(/[/"]/g, '').toUpperCase();
}
