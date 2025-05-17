/**
 * utils/exchangeTypeUtils.ts
 * 作成: 2025-10-08 - S-9: ExchangeType統一のための変換ユーティリティ
 * 更新: 2025-10-13 - S-12: 変換関数の強化と名前の統一
 * 更新: 2025-05-17 - ExchangeTypeとProductTypeの分離正規化
 *
 * 取引所タイプと取引種別の間の変換関数を提供します。
 * 型定義の統一に伴う移行期のコード互換性をサポートします。
 */

// タイプ定義をインポート
import {
  ExchangeType,
  ProductType,
} from '@/types/exchange';

// 型定義のエイリアス
// 移行期の互換性のために使用
type OriginalExchangeType = 'bitget' | 'binance' | 'bybit' | 'demo';
type LegacyProductType = 'spot' | 'futures';

// 新しい型に基づく定数配列
// 全ての取引所タイプを含む配列
export const EXCHANGE_TYPES = [
  'bitget',
  'binance',
  'bybit',
  'demo'
] as const;

// 全ての取引種別を含む配列
export const EXCHANGE_PRODUCT_TYPES = [
  'spot',
  'futures'
] as const;

/**
 * 取引所タイプに対応する取引種別のマッピング
 */
export const EXCHANGE_TO_PRODUCT_TYPE = {
  'bitget': 'spot' as ProductType,
  'binance': 'spot' as ProductType,
  'bybit': 'spot' as ProductType,
  'demo': 'futures' as ProductType
} as const;

/**
 * 取引種別 (spot, futures) から取引所タイプ (bitget, binance) へのデフォルトマッピング
 */
export const PRODUCT_TO_EXCHANGE_MAP: Record<ProductType, ExchangeType> = {
  'spot': 'bitget',
  'futures': 'demo'
};

/**
 * ExchangeTypeをProductTypeに変換する
 * @param exchangeType 取引所タイプ（bitget, binanceなど）
 * @returns 取引種別（spot, futuresなど）
 */
export function toProductType(exchangeType: ExchangeType): ProductType {
  // 予めが、実行時に文字列に変換して安全に処理
  const strValue = String(exchangeType);
  
  // 1. 先にProductType自身が渡された場合はそのまま返す
  if (strValue === 'spot' || strValue === 'futures') {
    return strValue as ProductType;
  }
  
  // 2. 取引所名から変換
  if (strValue === 'bitget') return 'spot';
  if (strValue === 'binance') return 'spot';
  if (strValue === 'bybit') return 'spot';
  if (strValue === 'demo') return 'futures';
  
  // 3. デフォルト値
  return 'spot';
}

/**
 * ProductTypeをExchangeTypeに変換する
 * @param productType 取引種別を示す文字列
 * @returns 取引所タイプ
 */
export function toExchangeType(productType: ProductType): ExchangeType {
  // 型チェックが不要なように必要な分岐を記述
  const inputValue = String(productType);

  // 1. 特定のProductTypeの場合は確定した値を返す
  if (inputValue === 'spot') return 'bitget';
  if (inputValue === 'futures') return 'demo';
  
  // 2. 既存のExchangeType値はそのまま返す
  if (inputValue === 'bitget') return 'bitget';
  if (inputValue === 'binance') return 'binance';
  if (inputValue === 'bybit') return 'bybit';
  if (inputValue === 'demo') return 'demo';
  
  // 3. それ以外はデフォルト値
  return 'bitget';
}

/**
 * 型識別関数: 値がExchangeType（取引所名）かを判定
 */
export function isActualExchangeType(value: unknown): value is OriginalExchangeType {
  if (typeof value !== 'string') return false;
  return value === 'bitget' || value === 'binance' || value === 'bybit' || value === 'demo';
}

/**
 * 型識別関数: 値がProductType（spot/futures）かを判定
 */
export function isActualProductType(value: unknown): value is LegacyProductType {
  if (typeof value !== 'string') return false;
  return value === 'spot' || value === 'futures';
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

  // 実行時の型判定のために安全に文字列に変換
  const strValue = String(value);

  // 1. ExchangeTypeの場合は単純に返す。複雑な型チェックを避ける。
  if (strValue === 'bitget') return 'bitget';
  if (strValue === 'binance') return 'binance';
  if (strValue === 'bybit') return 'bybit';
  if (strValue === 'demo') return 'demo';

  // 2. ProductTypeの場合は対応する取引所に変換
  if (strValue === 'spot') return 'bitget';
  if (strValue === 'futures') return 'demo';

  // 3. その他の場合はデフォルト値
  return 'bitget';
}

/**
 * 任意の値を有効なProductTypeに変換する
 * @param value 変換する値
 * @returns 有効なProductType
 */
export function safeProductType(value: unknown): ProductType {
  // nullまたはundefinedの場合はデフォルト値を返す
  if (value === null || value === undefined) {
    return 'spot';
  }

  // 実行時の型判定のために安全に文字列に変換
  const strValue = String(value);

  // 1. 既存ProductType値の場合
  if (EXCHANGE_PRODUCT_TYPES.includes(strValue as LegacyProductType)) {
    return strValue as ProductType;
  }

  // 2. ExchangeType値の場合は変換
  if (EXCHANGE_TYPES.includes(strValue as OriginalExchangeType)) {
    const exchangeType = strValue as OriginalExchangeType;
    if (exchangeType === 'bitget') return 'spot';
    if (exchangeType === 'binance') return 'spot';
    if (exchangeType === 'bybit') return 'spot';
    if (exchangeType === 'demo') return 'futures';
    return 'spot'; // デフォルト値
  }

  // 3. その他の場合はデフォルト値
  return 'spot';
}

/**
 * 指定された値が有効なExchangeTypeかどうかをチェック
 * @param value チェックする値
 * @returns 有効な場合はtrue
 */
export function isValidExchangeType(value: unknown): value is ExchangeType {
  if (typeof value !== 'string') return false;
  
  // 取引所名直接型のチェック
  if (value === 'bitget' || value === 'binance' || value === 'bybit' || value === 'demo') {
    return true;
  }
  
  // ProductTypeからの互換性チェック（新仕様ではExchangeTypeに含まれる可能性があるため）
  if (value === 'spot' || value === 'futures') {
    return true;
  }
  
  return false;
}

/**
 * 指定された値が有効なProductTypeかどうかをチェック
 * @param value チェックする値
 * @returns 有効な場合はtrue
 */
export function isValidProductType(value: unknown): value is ProductType {
  if (typeof value !== 'string') return false;
  return value === 'spot' || value === 'futures';
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