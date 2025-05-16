import type { PriceFormatOptions } from "@/types/common";

/**
 * 価格を指定されたフォーマットで表示する
 * @param price 価格
 * @param options フォーマットオプション
 * @returns フォーマットされた価格文字列
 */
const formatPrice = (
  price: number | string,
  options: PriceFormatOptions = {}
): string => {
  const {
    precision = 2,
    currency = '¥',
    showSymbol = true
  } = options;

  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '0';
  
  const formattedNumber = num.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
    useGrouping: true
  });
  
  return showSymbol ? `${currency}${formattedNumber}` : formattedNumber;
};

/**
 * パーセンテージをフォーマットする
 * @param value パーセンテージ値 (0-1 または 0-100)
 * @param options フォーマットオプション
 * @returns フォーマットされたパーセンテージ文字列
 */
const formatPercentage = (
  value: number,
  options: { isDecimal?: boolean; precision?: number } = {}
): string => {
  const { isDecimal = false, precision = 2 } = options;
  const percentageValue = isDecimal ? value * 100 : value;
  
  return `${percentageValue.toFixed(precision)}%`;
};

export { formatPrice, formatPercentage };
