/**
 * 取引所関連のユーティリティ関数
 */

import { ExchangeType, ExchangeProductType, EXCHANGE_TYPES } from '@/types/constants/enums';

/**
 * 取引所タイプ (bitget, binance) から取引種別 (spot, futures) へのマッピング
 */
const EXCHANGE_TO_PRODUCT_MAP: Record<ExchangeType, ExchangeProductType> = {
  'bitget': 'spot',
  'binance': 'spot',
  'bybit': 'spot',
  'demo': 'futures'
};

/**
 * ExchangeType を ExchangeProductType に変換する
 * @param exchangeType 取引所タイプ
 * @returns 取引タイプ（'spot' または 'futures'）
 */
export function toExchangeProductType(exchangeType: ExchangeType): ExchangeProductType {
  return EXCHANGE_TO_PRODUCT_MAP[exchangeType] || 'spot';
}

/**
 * ExchangeType が有効かどうかをチェックする
 * @param value チェックする値
 * @returns 有効な ExchangeType かどうか
 */
export function isValidExchangeType(value: string): value is ExchangeType {
  return ['bitget', 'binance', 'bybit', 'demo'].includes(value);
}

/**
 * ExchangeProductType が有効かどうかをチェックする
 * @param value チェックする値
 * @returns 有効な ExchangeProductType かどうか
 */
export function isValidExchangeProductType(value: string): value is ExchangeProductType {
  return value === 'spot' || value === 'futures';
}
