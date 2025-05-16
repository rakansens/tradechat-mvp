/**
 * utils/market/formatters.ts
 * マーケットデータ表示用のフォーマット関数を提供します
 * 価格、数量、パーセンテージなどの表示フォーマット関数が含まれています
 */

/**
 * 価格を通貨形式でフォーマットする
 * @param price フォーマットする価格
 * @param precision 小数点以下の桁数（デフォルト: 2）
 * @param currency 通貨記号（デフォルト: '$'）
 * @returns フォーマットされた価格文字列
 */
export function formatPrice(
  price: number | string | null | undefined,
  precision: number = 2,
  currency: string = '$'
): string {
  if (price === null || price === undefined || price === '') {
    return `${currency}0.00`;
  }
  
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // 非常に小さい値または大きい値の処理
  if (isNaN(numPrice)) {
    return `${currency}0.00`;
  }
  
  // 0の場合は特別処理
  if (numPrice === 0) {
    return `${currency}0.00`;
  }
  
  // 小さい値の場合は科学表記法を避ける
  if (Math.abs(numPrice) < 0.0001) {
    return `${currency}${numPrice.toFixed(8)}`;
  }
  
  // 通常の価格表示
  return `${currency}${numPrice.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  })}`;
}

/**
 * 数量をフォーマットする
 * @param amount フォーマットする数量
 * @param precision 小数点以下の桁数（デフォルト: 4）
 * @returns フォーマットされた数量文字列
 */
export function formatAmount(
  amount: number | string | null | undefined,
  precision: number = 4
): string {
  if (amount === null || amount === undefined || amount === '') {
    return '0.0000';
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0.0000';
  }
  
  // 0の場合は特別処理
  if (numAmount === 0) {
    return '0.0000';
  }
  
  // 小さい値の場合は科学表記法を避ける
  if (Math.abs(numAmount) < 0.0001) {
    return numAmount.toFixed(8);
  }
  
  return numAmount.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });
}

/**
 * パーセント値をフォーマットする
 * @param percentage フォーマットするパーセント値
 * @param precision 小数点以下の桁数（デフォルト: 2）
 * @param includePlus プラス記号を含めるかどうか（デフォルト: true）
 * @returns フォーマットされたパーセント文字列
 */
export function formatPercentage(
  percentage: number | string | null | undefined,
  precision: number = 2,
  includePlus: boolean = true
): string {
  if (percentage === null || percentage === undefined || percentage === '') {
    return '0.00%';
  }
  
  const numPercentage = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
  
  if (isNaN(numPercentage)) {
    return '0.00%';
  }
  
  // 正の値の場合にプラス記号を追加
  const sign = numPercentage > 0 && includePlus ? '+' : '';
  
  return `${sign}${numPercentage.toFixed(precision)}%`;
}

/**
 * 数値を適切な単位（K, M, B, T）でフォーマット
 * @param value フォーマットする数値
 * @param precision 小数点以下の桁数（デフォルト: 2）
 * @returns 単位付きでフォーマットされた文字列
 */
export function formatWithUnits(
  value: number | string | null | undefined,
  precision: number = 2
): string {
  if (value === null || value === undefined || value === '') {
    return '0';
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0';
  }
  
  // 0の場合は特別処理
  if (numValue === 0) {
    return '0';
  }
  
  const absValue = Math.abs(numValue);
  
  if (absValue >= 1e12) {
    return `${(numValue / 1e12).toFixed(precision)}T`;
  } else if (absValue >= 1e9) {
    return `${(numValue / 1e9).toFixed(precision)}B`;
  } else if (absValue >= 1e6) {
    return `${(numValue / 1e6).toFixed(precision)}M`;
  } else if (absValue >= 1e3) {
    return `${(numValue / 1e3).toFixed(precision)}K`;
  } else {
    return numValue.toFixed(precision);
  }
} 