// utils/format.ts
// 作成: フォーマット関連のユーティリティ関数

/**
 * 数値を指定された小数点以下の桁数でフォーマットする
 * @param num フォーマットする数値
 * @param digits 小数点以下の桁数
 * @returns フォーマットされた数値文字列
 */
export const formatNumber = (num: number, digits: number = 2): string => {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

/**
 * パーセンテージをフォーマットする
 * @param value パーセンテージ値
 * @param digits 小数点以下の桁数
 * @param includeSymbol %記号を含めるかどうか
 * @returns フォーマットされたパーセンテージ文字列
 */
export const formatPercentage = (
  value: number,
  digits: number = 2,
  includeSymbol: boolean = true
): string => {
  const formatted = formatNumber(value, digits);
  return includeSymbol ? `${formatted}%` : formatted;
};

/**
 * 大きな数値を省略形でフォーマットする（例: 1.2k, 3.4M）
 * @param num フォーマットする数値
 * @param digits 小数点以下の桁数
 * @returns 省略形でフォーマットされた数値文字列
 */
export const formatCompactNumber = (num: number, digits: number = 1): string => {
  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  
  if (absNum < 1000) {
    return sign + formatNumber(absNum, digits);
  } else if (absNum < 1000000) {
    return sign + formatNumber(absNum / 1000, digits) + "k";
  } else if (absNum < 1000000000) {
    return sign + formatNumber(absNum / 1000000, digits) + "M";
  } else {
    return sign + formatNumber(absNum / 1000000000, digits) + "B";
  }
};

/**
 * 文字列を指定された長さに切り詰め、必要に応じて省略記号を追加する
 * @param str 切り詰める文字列
 * @param maxLength 最大長
 * @param ellipsis 省略記号
 * @returns 切り詰められた文字列
 */
export const truncateString = (
  str: string,
  maxLength: number = 50,
  ellipsis: string = "..."
): string => {
  if (str.length <= maxLength) {
    return str;
  }
  
  return str.slice(0, maxLength - ellipsis.length) + ellipsis;
};

/**
 * 文字列の先頭を大文字にする
 * @param str 変換する文字列
 * @returns 先頭が大文字の文字列
 */
export const capitalizeFirstLetter = (str: string): string => {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * キャメルケースをスネークケースに変換する
 * @param str キャメルケースの文字列
 * @returns スネークケースの文字列
 */
export const camelToSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * スネークケースをキャメルケースに変換する
 * @param str スネークケースの文字列
 * @returns キャメルケースの文字列
 */
export const snakeToCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};
