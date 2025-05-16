/**
 * types/converters/common.ts
 * 作成: T-7.5フェーズ - 共通型変換関数
 * 
 * このファイルでは、数値以外の一般的なデータ型変換関数を提供します。
 * 文字列操作、日時変換、配列変換などの共通ユーティリティを実装しています。
 */

import { toNumber } from './number';

/**
 * 値が有効か（null, undefined, 空文字でない）チェック
 * @param value チェック対象の値
 * @returns 有効な値の場合true
 */
export function isValidValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return true;
}

/**
 * 文字列型への安全な変換
 * @param value 変換対象の値
 * @param fallback 変換失敗時のデフォルト値
 * @returns 文字列型
 */
export function toString(value: unknown, fallback: string = ''): string {
  if (value === null || value === undefined) return fallback;
  
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  
  try {
    // オブジェクト型などの変換
    return String(value);
  } catch (e) {
    return fallback;
  }
}

/**
 * 文字列を安全に大文字に変換
 * @param value 変換対象の文字列
 * @returns 大文字変換した文字列
 */
export function toUpperCase(value: unknown): string {
  const str = toString(value);
  return str.toUpperCase();
}

/**
 * 文字列を安全に小文字に変換
 * @param value 変換対象の文字列
 * @returns 小文字変換した文字列
 */
export function toLowerCase(value: unknown): string {
  const str = toString(value);
  return str.toLowerCase();
}

/**
 * UnixタイムスタンプをDateオブジェクトに変換
 * @param timestamp Unixタイムスタンプ（秒またはミリ秒）
 * @returns Dateオブジェクト
 */
export function toDate(timestamp: number | string): Date {
  const numTimestamp = toNumber(timestamp);
  
  // 秒単位のタイムスタンプの場合はミリ秒に変換
  if (numTimestamp < 10000000000) {
    return new Date(numTimestamp * 1000);
  }
  
  return new Date(numTimestamp);
}

/**
 * DateオブジェクトをUnixタイムスタンプ（秒）に変換
 * @param date Dateオブジェクトまたはタイムスタンプ
 * @returns Unixタイムスタンプ（秒単位）
 */
export function toUnixTimestamp(date: Date | number | string): number {
  if (date instanceof Date) {
    return Math.floor(date.getTime() / 1000);
  }
  
  const numValue = toNumber(date);
  // ミリ秒単位のタイムスタンプの場合は秒に変換
  if (numValue > 10000000000) {
    return Math.floor(numValue / 1000);
  }
  
  return Math.floor(numValue);
}

/**
 * 配列に変換（配列でない場合は単一要素の配列にする）
 * @param value 変換対象の値
 * @returns 配列型
 */
export function toArray<T>(value: T | T[]): T[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

/**
 * 安全にBoolean型に変換
 * @param value 変換対象の値
 * @returns boolean型
 */
export function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (value === null || value === undefined) return false;
  
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    return normalized === 'true' || normalized === 'yes' || normalized === '1';
  }
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  return Boolean(value);
} 