/**
 * シンボル関連の型定義
 * 
 * このファイルは銘柄情報と関連機能の型定義を集約しています。
 * T-4フェーズでtypes/symbol.tsから移動されました。
 * T-6フェーズで重複型定義を解消し、共通モジュールからインポートするように変更しました。
 */

import { ExchangeType, ExchangeProductType } from '../constants/enums';
import { SymbolInfo, SymbolChangeHistoryEntry } from './common';
import { SymbolState } from './store';
import type { SymbolFilterOptions } from '../common/symbol';

// 共通型を再エクスポート
export type { SymbolInfo, SymbolChangeHistoryEntry };

/** @deprecated – 直接 `SymbolFilterOptions` を使用してください。 */
export type FilterOptions = SymbolFilterOptions;

/**
 * UI層用のシンボル情報型（レガシー互換性のため）
 * @deprecated common/symbol.tsのSymbolInfoを使用し、必要に応じて変換してください。
 */
export interface LegacySymbolInfo {
  /** 銘柄のシンボル (例: BTCUSDT) */
  symbol: string;
  /** 基礎通貨 (例: BTC) */
  baseAsset: string;
  /** 見積通貨 (例: USDT) */
  quoteCoin: string;
  /** 表示名 (例: BTC/USDT) */
  displayName: string;
  /** 価格の精度 (小数点以下の桁数) */
  pricePrecision: number;
  /** 数量の精度 (小数点以下の桁数) */
  quantityPrecision: number;
  /** 最小取引額 */
  minNotional?: string;
  /** 取引ステータス (例: TRADING, BREAK) */
  status: string;
  /** お気に入りフラグ */
  favorite?: boolean;
  /** 24時間取引量 */
  volume24h?: string;
  /** 24時間価格変動率 */
  priceChangePercent24h?: string;
  /** 最新価格 */
  lastPrice?: string;
}

/**
 * シンボルスライスの状態型定義
 * @deprecated 代わりに SymbolState を使用してください
 */
export interface SymbolSliceState extends SymbolState {}

/**
 * 共通SymbolInfo型とレガシーSymbolInfo型の変換関数
 */
export function toUISymbol(commonSymbol: SymbolInfo): LegacySymbolInfo {
  return {
    symbol: commonSymbol.symbol,
    baseAsset: commonSymbol.baseCoin,
    quoteCoin: commonSymbol.quoteCoin,
    displayName: `${commonSymbol.baseCoin}/${commonSymbol.quoteCoin}`,
    pricePrecision: commonSymbol.pricePrecision,
    quantityPrecision: commonSymbol.quantityPrecision,
    minNotional: (commonSymbol.minOrderSize || 0).toString(),
    status: commonSymbol.status,
    favorite: commonSymbol.favorite || false
  };
}

/**
 * レガシーSymbolInfo型から共通SymbolInfo型への変換関数
 * @param uiSymbol 変換対象のレガシーシンボル情報
 * @param exchangeType 取引タイプ（'spot' または 'futures'）
 */
export function toCommonSymbol(uiSymbol: LegacySymbolInfo, exchangeType: ExchangeProductType): SymbolInfo {
  return {
    id: `${exchangeType}:${uiSymbol.symbol}`,
    symbol: uiSymbol.symbol,
    baseCoin: uiSymbol.baseAsset,
    quoteCoin: uiSymbol.quoteCoin,
    minOrderSize: uiSymbol.minNotional ? parseFloat(uiSymbol.minNotional) : 0.001, 
    pricePrecision: uiSymbol.pricePrecision,
    quantityPrecision: uiSymbol.quantityPrecision,
    status: uiSymbol.status,
    exchangeType,
    favorite: uiSymbol.favorite || false 
  };
} 