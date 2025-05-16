/**
 * utils/json.ts
 * JSON操作に関するユーティリティ関数
 */

/**
 * オブジェクトの安全なシリアライズ
 * 循環参照やその他のシリアライズできない値を扱うことができる
 * 
 * @param value シリアライズする値
 * @returns JSON文字列、またはエラーが発生した場合は空オブジェクトの文字列
 */
export function safeStringify(value: any): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.error('Failed to stringify value:', error);
    return '{}';
  }
}

/**
 * オブジェクトの推定サイズ（バイト単位）を計算
 * 
 * @param value サイズを計測する値
 * @returns 推定サイズ（バイト単位）
 */
export function calculateSize(value: any): number {
  try {
    return JSON.stringify(value).length;
  } catch (error) {
    console.error('Failed to calculate size:', error);
    return 0;
  }
}

/**
 * 安全なJSONパース
 * 
 * @param text パースするJSON文字列
 * @param defaultValue パースに失敗した場合のデフォルト値
 * @returns パースされたオブジェクトまたはデフォルト値
 */
export function safeParse<T>(text: string, defaultValue: T): T {
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return defaultValue;
  }
}

export default {
  safeStringify,
  calculateSize,
  safeParse
}; 