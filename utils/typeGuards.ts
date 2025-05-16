/**
 * utils/typeGuards.ts
 * 作成: T-7.5フェーズ - 型安全性向上のための型ガード関数
 * 
 * このファイルでは、TypeScriptの型安全性を高めるための
 * 様々な型ガード関数を提供します。特にnullやundefined、
 * unknown型の安全な処理に役立ちます。
 */

/**
 * 値がnullまたはundefinedでないことを確認する型ガード
 * @param value チェック対象の値
 * @returns 値が存在する場合true
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * 値が文字列型かどうかを確認する型ガード
 * @param value チェック対象の値
 * @returns 文字列の場合true
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 値が数値型かどうかを確認する型ガード
 * @param value チェック対象の値
 * @returns 数値の場合true
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * 値がbooleanかどうかを確認する型ガード
 * @param value チェック対象の値
 * @returns booleanの場合true
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * 値が配列かどうかを確認する型ガード
 * @param value チェック対象の値
 * @returns 配列の場合true
 */
export function isArray<T>(value: unknown): value is Array<T> {
  return Array.isArray(value);
}

/**
 * オブジェクトかつnullでないことを確認する型ガード
 * @param value チェック対象の値
 * @returns オブジェクトの場合true
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 値がレコード型（キー・バリューペア）かどうかを確認する型ガード
 * @param value チェック対象の値
 * @returns レコード型の場合true
 */
export function isRecord<T = unknown>(value: unknown): value is Record<string, T> {
  return isObject(value);
}

/**
 * nullとundefinedを許容する値を安全に使用するためのガード
 * @param value チェック対象の値
 * @param fallback 値が存在しない場合のデフォルト値
 * @returns 値が存在する場合はその値、それ以外はfallback
 */
export function safeValue<T>(value: T | null | undefined, fallback: T): T {
  return isDefined(value) ? value : fallback;
}

/**
 * 特定のプロパティを持つオブジェクトかどうかをチェックする型ガード
 * @param value チェック対象のオブジェクト
 * @param propertyName 必須プロパティ名
 * @returns 指定したプロパティを持つ場合true
 */
export function hasProperty<K extends string>(
  value: unknown,
  propertyName: K
): value is { [key in K]: unknown } {
  return isObject(value) && propertyName in value;
}

/**
 * 指定されたキーを持つマップかどうかを確認する型ガード
 * @param value チェック対象のオブジェクト
 * @param keys 必須キー配列
 * @returns すべてのキーを持つ場合true
 */
export function hasAllProperties<K extends string>(
  value: unknown,
  keys: K[]
): value is { [key in K]: unknown } {
  return isObject(value) && keys.every(key => key in value);
}

/**
 * 値が有効なDateオブジェクトかどうかを確認する型ガード
 * @param value チェック対象の値
 * @returns 有効なDateオブジェクトの場合true
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * 配列の要素が特定の型かどうかをチェックする型ガード
 * @param arr チェック対象の配列
 * @param predicate 各要素に適用する型ガード関数
 * @returns すべての要素が型ガードを通過する場合true
 */
export function isArrayOf<T>(
  arr: unknown[],
  predicate: (item: unknown) => item is T
): arr is T[] {
  return arr.every(predicate);
}

/**
 * 非空の配列かどうかを確認する型ガード
 * @param value チェック対象の値
 * @returns 少なくとも1つの要素を持つ配列の場合true
 */
export function isNonEmptyArray<T>(value: T[]): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * オブジェクト型をキャストするためのヘルパー（TypeScriptの型システムのため）
 * @param obj キャスト対象のオブジェクト
 * @returns 指定した型にキャストされたオブジェクト
 */
export function asType<T>(obj: unknown): T {
  return obj as T;
} 