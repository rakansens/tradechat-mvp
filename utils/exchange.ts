/**
 * 取引所関連のユーティリティ関数
 * 更新: 2025-05-17 - インポートパスを統一し、関数名を整理
 */

import { ExchangeType, ProductType } from '@/types/constants/enums';

// 全ての取引所タイプを含む配列 (exchangeTypeUtils.tsで定義されているものと同一)
const EXCHANGE_TYPES = ['bitget', 'binance', 'bybit', 'demo'] as const;

/**
 * 取引所タイプ (bitget, binance) から取引種別 (spot, futures) へのマッピング
 */
const EXCHANGE_TO_PRODUCT_MAP = {
  'bitget': 'spot' as ProductType,
  'binance': 'spot' as ProductType,
  'bybit': 'spot' as ProductType,
  'demo': 'futures' as ProductType
} as const;

/**
 * ExchangeType を ProductType に変換する
 * @param exchangeType 取引所タイプ
 * @returns 取引種別（'spot' または 'futures'）
 */
export function toProductType(exchangeType: ExchangeType): ProductType {
  // ExchangeType型の値を文字列として扱い、安全にデータ取得
  const key = String(exchangeType);
  
  if (key === 'bitget' || key === 'binance' || key === 'bybit') return 'spot';
  if (key === 'demo') return 'futures';
  
  // デフォルト値
  return 'spot';
}

/**
 * ExchangeType が有効かどうかをチェックする
 * @param value チェックする値
 * @returns 有効な ExchangeType かどうか
 */
export function isValidExchangeType(value: string): value is ExchangeType {
  return value === 'bitget' || value === 'binance' || value === 'bybit' || value === 'demo';
}

/**
 * ProductType が有効かどうかをチェックする
 * @param value チェックする値
 * @returns 有効な ProductType かどうか
 */
export function isValidProductType(value: string): value is ProductType {
  return value === 'spot' || value === 'futures';
}

/**
 * ExchangeTypeとProductTypeの組み合わせが有効かどうかをチェックする
 * @param exchangeProductType チェックする値
 * @returns 有効な ExchangeProductType かどうか
 * @deprecated isValidProductTypeを使用してください
 */
export function isValidExchangeProductType(exchangeProductType: string): exchangeProductType is ProductType {
  return isValidProductType(exchangeProductType);
}
