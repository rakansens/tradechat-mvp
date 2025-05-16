/**
 * types/converters/number.ts
 * 作成: T-7.5フェーズ - 数値型変換関数
 * 
 * このファイルでは、数値データの型変換と精度管理のための関数を提供します。
 * APIレスポンスや外部データソースからの数値を適切に内部形式に変換し、
 * UI表示や計算に適した形式に整形するための機能を実装しています。
 */

import { DEFAULT_PRECISION, getPricePrecision, getAmountPrecision } from '../constants/precision';

/**
 * 文字列またはnumber型の値を適切な精度の数値に変換
 * @param value 変換対象の値
 * @param fallback 変換失敗時のデフォルト値
 * @returns 数値型
 */
export function toNumber(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  
  return fallback;
}

/**
 * 数値を文字列に変換（精度指定あり）
 * @param value 変換対象の数値
 * @param precision 小数点以下の桁数
 * @returns フォーマット済み文字列
 */
export function toFormattedString(value: number | string, precision: number = DEFAULT_PRECISION.PRICE): string {
  const numValue = toNumber(value);
  return numValue.toFixed(precision).replace(/\.?0+$/, '');
}

/**
 * 価格データを適切な精度で文字列に変換
 * @param price 価格データ
 * @param pair 通貨ペア
 * @returns フォーマット済み価格文字列
 */
export function toPriceString(price: number | string, pair: string): string {
  return toFormattedString(price, getPricePrecision(pair));
}

/**
 * 数量データを適切な精度で文字列に変換
 * @param amount 数量データ
 * @param pair 通貨ペア
 * @returns フォーマット済み数量文字列
 */
export function toAmountString(amount: number | string, pair: string): string {
  return toFormattedString(amount, getAmountPrecision(pair));
}

/**
 * パーセント値を文字列に変換
 * @param value パーセント値（例: 0.156 -> 15.6%）
 * @param precision 小数点以下の桁数
 * @returns フォーマット済みパーセント文字列
 */
export function toPercentString(value: number | string, precision: number = DEFAULT_PRECISION.PERCENTAGE): string {
  const numValue = toNumber(value) * 100;
  return `${numValue.toFixed(precision).replace(/\.?0+$/, '')}%`;
}

/**
 * 数値を精度を保持した文字列として取得
 * DBやAPI通信に使用（精度損失防止）
 * @param value 数値
 * @returns 文字列表現
 */
export function toPreciseString(value: number | string): string {
  if (typeof value === 'string') return value;
  return value.toString();
}

/**
 * 文字列から数値への安全な変換（DB->アプリ）
 * @param value DB等から取得した文字列値
 * @returns 数値型
 */
export function fromDBNumber(value: string | number | null): number {
  if (value === null) return 0;
  return toNumber(value);
}

/**
 * アプリから数値を文字列に変換（アプリ->DB）
 * @param value アプリ内の数値
 * @returns DB保存用の文字列
 */
export function toDBNumber(value: number | string): string {
  return toPreciseString(value);
} 