/**
 * types/exchange.ts
 * 取引所と取引種別の型定義
 * 
 * 作成: 2025-05-17 - ExchangeTypeとProductTypeの分離正規化
 * 
 * このファイルは取引所タイプと取引種別の型定義を
 * Single Source of Truthとして一元管理します。
 */

// 取引所の種類
export type ExchangeType = 'bitget' | 'binance' | 'bybit' | 'demo';

// 取引種別（現物/先物）
export type ProductType = 'spot' | 'futures';

// 取引所から取引種別へのマッピング
export const EXCHANGE_TO_PRODUCT_TYPE: Record<ExchangeType, ProductType> = {
  bitget: 'spot',
  binance: 'spot',
  bybit: 'spot',
  demo: 'futures',
};

/**
 * 取引所タイプから取引種別を取得
 * @param ex 取引所タイプ
 * @returns 対応する取引種別
 */
export function getProductTypeFromExchange(ex: ExchangeType): ProductType {
  return EXCHANGE_TO_PRODUCT_TYPE[ex];
}

// 既存タイプからのエイリアス（移行期用）
import { ExchangeType as OriginalExchangeType, ExchangeProductType } from './constants/enums';

// 互換性のための型エイリアス
export type LegacyExchangeType = OriginalExchangeType;
export type LegacyProductType = ExchangeProductType;
