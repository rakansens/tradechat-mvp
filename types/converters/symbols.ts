/**
 * types/converters/symbols.ts
 * 作成: T-7.5フェーズ - シンボル（通貨ペア）データ変換関数
 * 
 * このファイルでは、シンボル（取引ペア）データの変換機能を提供します。
 * 特にAPIレスポンスやDBからのデータを内部モデルに変換する関数を実装しています。
 */

import { ExchangeProductType } from '../constants/enums';
import { isDefined, isString, isObject, hasAllProperties } from '@/utils/typeGuards';
import { toNumber } from './number';
import { toString, toLowerCase } from './common';

/**
 * シンボル情報の基本型（内部モデル）
 */
export interface SymbolInfo {
  symbol: string;
  baseAsset: string;
  quoteCoin: string;
  exchangeType: ExchangeProductType;
  pricePrecision: number;
  quantityPrecision: number;
  minPrice?: number;
  maxPrice?: number;
  minQty?: number;
  maxQty?: number;
  status?: string;
  isActive?: boolean;
}

/**
 * APIレスポンスからのシンボル情報型
 */
export interface ApiSymbolResponse {
  symbol?: string;
  baseAsset?: string;
  quoteCoin?: string;
  pricePrecision?: number | string;
  quantityPrecision?: number | string;
  status?: string;
  [key: string]: unknown;
}

/**
 * DBから取得したシンボル情報型
 */
export interface DbSymbolRecord {
  symbol?: string;
  base_asset?: string;
  quote_asset?: string;
  exchange_type?: string;
  price_precision?: number | string;
  quantity_precision?: number | string;
  min_price?: number | string;
  max_price?: number | string;
  min_qty?: number | string;
  max_qty?: number | string;
  status?: string;
  is_active?: boolean;
  [key: string]: unknown;
}

/**
 * レスポンスデータをSymbolInfo型かどうか検証する型ガード
 * @param data 検証対象のデータ
 * @returns SymbolInfo型の場合true
 */
export function isSymbolInfo(data: unknown): data is SymbolInfo {
  if (!isObject(data)) return false;
  
  return hasAllProperties(data, ['symbol', 'baseAsset', 'quoteCoin', 'exchangeType']) &&
    isString(data.symbol) &&
    isString(data.baseAsset) &&
    isString(data.quoteCoin);
}

/**
 * APIレスポンスからSymbolInfo型に変換
 * @param data APIから受け取ったシンボルデータ
 * @param exchangeType 取引タイプ（現物/先物）
 * @returns 整形されたSymbolInfo
 */
export function fromApiSymbol(data: ApiSymbolResponse, exchangeType: ExchangeProductType): SymbolInfo {
  return {
    symbol: toString(data.symbol || ''),
    baseAsset: toString(data.baseAsset || ''),
    quoteCoin: toString(data.quoteCoin || ''),
    exchangeType,
    pricePrecision: toNumber(data.pricePrecision, 8),
    quantityPrecision: toNumber(data.quantityPrecision, 6),
    status: toString(data.status, 'TRADING'),
    isActive: true
  };
}

/**
 * DBレコードからSymbolInfo型に変換
 * @param record DBから取得したシンボルレコード
 * @returns 整形されたSymbolInfo
 */
export function fromDbSymbol(record: DbSymbolRecord): SymbolInfo {
  const exchangeType = isDefined(record.exchange_type) && 
    (toLowerCase(record.exchange_type) === 'spot' || toLowerCase(record.exchange_type) === 'futures')
    ? toLowerCase(record.exchange_type) as ExchangeProductType
    : 'spot';

  return {
    symbol: toString(record.symbol, ''),
    baseAsset: toString(record.base_asset, ''),
    quoteCoin: toString(record.quote_asset, ''),
    exchangeType,
    pricePrecision: toNumber(record.price_precision, 8),
    quantityPrecision: toNumber(record.quantity_precision, 6),
    minPrice: toNumber(record.min_price),
    maxPrice: toNumber(record.max_price),
    minQty: toNumber(record.min_qty),
    maxQty: toNumber(record.max_qty),
    status: toString(record.status, 'TRADING'),
    isActive: record.is_active !== false
  };
}

/**
 * SymbolInfoをDBレコード形式に変換
 * @param symbol 変換対象のシンボル情報
 * @returns DBレコード形式のデータ
 */
export function toDbSymbol(symbol: SymbolInfo): DbSymbolRecord {
  return {
    symbol: symbol.symbol,
    base_asset: symbol.baseAsset,
    quote_asset: symbol.quoteCoin,
    exchange_type: symbol.exchangeType,
    price_precision: symbol.pricePrecision,
    quantity_precision: symbol.quantityPrecision,
    min_price: symbol.minPrice,
    max_price: symbol.maxPrice,
    min_qty: symbol.minQty,
    max_qty: symbol.maxQty,
    status: symbol.status || 'TRADING',
  is_active: symbol.isActive !== false
  };
}
