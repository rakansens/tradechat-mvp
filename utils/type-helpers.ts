// utils/type-helpers.ts
// 型変換ヘルパー関数
// 作成日: 2025/6/20

/**
 * null値をundefinedに変換するユーティリティ関数
 * 主にデータベースからのnull値とTypeScript interfaceのundefined型の互換性を確保するために使用
 */
export const nullsafe = {
  /**
   * null値のbooleanをundefinedに変換
   */
  boolean: (value: boolean | null): boolean | undefined => 
    value === null ? undefined : value,
  
  /**
   * null値のnumberをundefinedに変換
   */
  number: (value: number | null): number | undefined => 
    value === null ? undefined : value,
  
  /**
   * null値のstringをundefinedに変換
   */
  string: (value: string | null): string | undefined => 
    value === null ? undefined : value,
  
  /**
   * null値の配列をundefinedに変換
   */
  array: <T>(value: T[] | null): T[] | undefined => 
    value === null ? undefined : value,
  
  /**
   * null値のオブジェクトをundefinedに変換
   */
  object: <T extends object>(value: T | null): T | undefined => 
    value === null ? undefined : value,
  
  /**
   * 任意の型のnull値をundefinedに変換
   */
  any: <T>(value: T | null): T | undefined =>
    value === null ? undefined : value
}; 