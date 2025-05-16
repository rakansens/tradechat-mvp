/**
 * utils/exchangeTypeUtils.ts
 * 作成: 2025-10-08 - S-9: ExchangeType統一のための変換ユーティリティ
 * 更新: 2025-10-13 - S-12: 変換関数の強化と名前の統一
 * 
 * このファイルはExchangeTypeとExchangeProductTypeの相互変換を行うユーティリティを提供します。
 * 型定義の統一に伴う移行期のコード互換性をサポートします。
 */

import { 
  ExchangeType, 
  ExchangeProductType,
  EXCHANGE_TYPES,
  EXCHANGE_PRODUCT_TYPES 
} from '@/types/constants/enums';

/**
 * 取引所タイプ (bitget, binance) から取引種別 (spot, futures) へのマッピング
 */
export const EXCHANGE_TO_PRODUCT_MAP: Record<ExchangeType, ExchangeProductType> = {
  'bitget': 'spot',
  'binance': 'spot',
  'bybit': 'spot',
  'demo': 'futures'
};

/**
 * 取引種別 (spot, futures) から取引所タイプ (bitget, binance) へのデフォルトマッピング
 */
export const PRODUCT_TO_EXCHANGE_MAP: Record<ExchangeProductType, ExchangeType> = {
  'spot': 'bitget',
  'futures': 'demo'
};

/**
 * ExchangeTypeをExchangeProductTypeに変換する
 * @param exchangeType 取引所タイプ（bitget, binanceなど）
 * @returns 取引種別（spot, futuresなど）
 */
export function toProductType(exchangeType: ExchangeType): ExchangeProductType {
  return EXCHANGE_TO_PRODUCT_MAP[exchangeType] || 'spot';
}

/**
 * ExchangeProductTypeをExchangeTypeに変換する
 * @param productType 取引種別（spot, futuresなど）
 * @returns 取引所タイプ（bitget, binanceなど）
 */
export function toExchangeType(productType: ExchangeProductType): ExchangeType {
  return PRODUCT_TO_EXCHANGE_MAP[productType] || 'bitget';
}

/**
 * 任意の値を有効なExchangeTypeに変換する
 * @param value 変換する値
 * @returns 有効なExchangeType
 */
export function safeExchangeType(value: unknown): ExchangeType {
  // nullまたはundefinedの場合はデフォルト値を返す
  if (value === null || value === undefined) {
    return 'bitget';
  }

  // すでにExchangeTypeの場合はそのまま返す
  if (typeof value === 'string' && EXCHANGE_TYPES.includes(value as ExchangeType)) {
    return value as ExchangeType;
  }

  // ExchangeProductTypeっぽい値の場合は変換
  if (typeof value === 'string' && EXCHANGE_PRODUCT_TYPES.includes(value as ExchangeProductType)) {
    return toExchangeType(value as ExchangeProductType);
  }

  // その他の場合はデフォルト値
  return 'bitget';
}

/**
 * 任意の値を有効なExchangeProductTypeに変換する
 * @param value 変換する値
 * @returns 有効なExchangeProductType
 */
export function safeProductType(value: unknown): ExchangeProductType {
  // nullまたはundefinedの場合はデフォルト値を返す
  if (value === null || value === undefined) {
    return 'spot';
  }

  // すでにExchangeProductTypeの場合はそのまま返す
  if (typeof value === 'string' && EXCHANGE_PRODUCT_TYPES.includes(value as ExchangeProductType)) {
    return value as ExchangeProductType;
  }

  // ExchangeTypeっぽい値の場合は変換
  if (typeof value === 'string' && EXCHANGE_TYPES.includes(value as ExchangeType)) {
    return toProductType(value as ExchangeType);
  }

  // その他の場合はデフォルト値
  return 'spot';
}

/**
 * 指定された値が有効なExchangeTypeかどうかをチェック
 * @param value チェックする値
 * @returns 有効な場合はtrue
 */
export function isValidExchangeType(value: unknown): value is ExchangeType {
  return typeof value === 'string' && EXCHANGE_TYPES.includes(value as ExchangeType);
}

/**
 * 指定された値が有効なExchangeProductTypeかどうかをチェック
 * @param value チェックする値
 * @returns 有効な場合はtrue
 */
export function isValidProductType(value: unknown): value is ExchangeProductType {
  return typeof value === 'string' && EXCHANGE_PRODUCT_TYPES.includes(value as ExchangeProductType);
}

/**
 * 型互換性チェック用の型アサーション（開発時の型チェック用）
 * @param _exchangeType 
 */
export function assertExchangeType(_exchangeType: ExchangeType): void {
  // コンパイル時型チェック用のダミー関数
}

// 後方互換性のためのエイリアス - 将来的には削除予定
/**
 * @deprecated toProductTypeを使用してください
 */
export const exchangeToProductType = toProductType;

/**
 * @deprecated toExchangeTypeを使用してください
 */
export const productToExchangeType = toExchangeType; 