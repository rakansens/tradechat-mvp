/**
 * types/converters/entries.ts
 * 作成: T-7.5フェーズ - トレードエントリーデータ変換関数
 * 更新: T-7.5フェーズ - 型エラーを修正
 * 
 * このファイルでは、トレードエントリー関連のデータ変換機能を提供します。
 * APIレスポンスやDBからのデータを内部モデルに変換したり、
 * UI表示用のフォーマットに整形するための関数を実装しています。
 */

import { ExchangeProductType, TradeSide } from '../constants/enums';
import { isDefined, isObject, hasAllProperties } from '@/utils/typeGuards';
import { toNumber, toPreciseString } from './number';
import { toString, toDate, toUnixTimestamp } from './common';

/**
 * トレードエントリーの基本型（内部モデル）
 */
export interface TradeEntry {
  id: string;
  userId: string;
  symbol: string;
  exchangeType: ExchangeProductType;
  side: TradeSide;
  price: number;
  amount: number;
  leverage?: number;
  stopLoss?: number;
  takeProfit?: number;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  closedAt?: Date;
  closePrice?: number;
  pnl?: number;
  status: 'open' | 'closed' | 'cancelled';
}

/**
 * APIから受け取るエントリーデータ型
 */
export interface ApiEntryResponse {
  id?: string;
  user_id?: string;
  symbol?: string;
  exchange_type?: string;
  side?: string;
  price?: number | string;
  amount?: number | string;
  leverage?: number | string;
  stop_loss?: number | string;
  take_profit?: number | string;
  notes?: string;
  created_at?: string | number;
  updated_at?: string | number;
  closed_at?: string | number;
  close_price?: number | string;
  pnl?: number | string;
  status?: string;
  [key: string]: unknown;
}

/**
 * DBから取得するエントリーレコード型
 */
export interface DbEntryRecord {
  id?: string;
  user_id?: string;
  symbol?: string;
  exchange_type?: string;
  side?: string;
  price?: number | string;
  amount?: number | string;
  leverage?: number | string | null;
  stop_loss?: number | string | null;
  take_profit?: number | string | null;
  notes?: string;
  created_at?: string | number;
  updated_at?: string | number | null;
  closed_at?: string | number | null;
  close_price?: number | string | null;
  pnl?: number | string | null;
  status?: string;
  [key: string]: unknown;
}

/**
 * 値がTradeEntry型かどうかを確認する型ガード
 * @param data 検証対象のデータ
 * @returns TradeEntry型の場合true
 */
export function isTradeEntry(data: unknown): data is TradeEntry {
  if (!isObject(data)) return false;
  
  // 必須プロパティをチェック
  if (!hasAllProperties(data, ['id', 'userId', 'symbol', 'side', 'price', 'amount', 'status', 'createdAt'])) {
    return false;
  }
  
  // createdAtがDate型かチェック
  return data.createdAt instanceof Date;
}

/**
 * トレード方向（買い/売り）を文字列から内部表現に変換
 * @param sideStr 文字列表現のトレード方向
 * @returns 'buy' または 'sell'
 */
export function parseTradeSide(sideStr: string | undefined | null): TradeSide {
  if (!sideStr) return 'buy';
  
  const normalized = sideStr.toLowerCase().trim();
  
  if (normalized === 'buy' || 
      normalized === 'long' || 
      normalized === 'b') {
    return 'buy';
  }
  
  if (normalized === 'sell' || 
      normalized === 'short' || 
      normalized === 's') {
    return 'sell';
  }
  
  return 'buy'; // デフォルトは買い
}

/**
 * トレードステータスを文字列から内部表現に変換
 * @param statusStr 文字列表現のステータス
 * @returns 'open', 'closed', または 'cancelled'
 */
export function parseTradeStatus(statusStr: string | undefined | null): 'open' | 'closed' | 'cancelled' {
  if (!statusStr) return 'open';
  
  const normalized = statusStr.toLowerCase().trim();
  
  if (normalized === 'open' || 
      normalized === 'active' || 
      normalized === 'new') {
    return 'open';
  }
  
  if (normalized === 'closed' || 
      normalized === 'complete' || 
      normalized === 'completed' || 
      normalized === 'filled') {
    return 'closed';
  }
  
  if (normalized === 'cancelled' || 
      normalized === 'canceled' || 
      normalized === 'cancel' || 
      normalized === 'rejected') {
    return 'cancelled';
  }
  
  return 'open'; // デフォルトはオープン
}

/**
 * DBレコードからTradeEntry型に変換
 * @param record DBから取得したエントリーレコード
 * @returns 内部モデル形式のエントリー
 */
export function fromDbEntry(record: DbEntryRecord): TradeEntry {
  // 取引所タイプを解析
  const exchangeType = isDefined(record.exchange_type) &&
    (toString(record.exchange_type).toLowerCase() === 'futures')
    ? 'futures' as ExchangeProductType
    : 'spot' as ExchangeProductType;
  
  // トレード方向を解析
  const side = parseTradeSide(toString(record.side));
  
  // ステータスを解析
  const status = parseTradeStatus(toString(record.status));
  
  // 日付を変換
  const createdAt = record.created_at ? toDate(record.created_at) : new Date();
  const updatedAt = record.updated_at ? toDate(record.updated_at) : undefined;
  const closedAt = record.closed_at ? toDate(record.closed_at) : undefined;
  
  return {
    id: toString(record.id, ''),
    userId: toString(record.user_id, ''),
    symbol: toString(record.symbol, ''),
    exchangeType,
    side,
    price: toNumber(record.price, 0),
    amount: toNumber(record.amount, 0),
    leverage: toNumber(record.leverage),
    stopLoss: toNumber(record.stop_loss),
    takeProfit: toNumber(record.take_profit),
    notes: toString(record.notes, ''),
    createdAt,
    updatedAt,
    closedAt,
    closePrice: toNumber(record.close_price),
    pnl: toNumber(record.pnl),
    status
  };
}

/**
 * APIレスポンスからTradeEntry型に変換
 * @param data APIから受け取ったエントリーデータ
 * @returns 内部モデル形式のエントリー
 */
export function fromApiEntry(data: ApiEntryResponse): TradeEntry {
  return fromDbEntry(data); // APIとDBの形式が同じなので共通関数を使用
}

/**
 * TradeEntryをDBレコード形式に変換
 * @param entry 変換対象のエントリー
 * @returns DBレコード形式のデータ
 */
export function toDbEntry(entry: TradeEntry): DbEntryRecord {
  return {
    id: entry.id,
    user_id: entry.userId,
    symbol: entry.symbol,
    exchange_type: entry.exchangeType,
    side: entry.side,
    price: toPreciseString(entry.price),
    amount: toPreciseString(entry.amount),
    leverage: entry.leverage ? toPreciseString(entry.leverage) : undefined,
    stop_loss: entry.stopLoss ? toPreciseString(entry.stopLoss) : undefined,
    take_profit: entry.takeProfit ? toPreciseString(entry.takeProfit) : undefined,
    notes: entry.notes || '',
    created_at: toUnixTimestamp(entry.createdAt),
    updated_at: entry.updatedAt ? toUnixTimestamp(entry.updatedAt) : undefined,
    closed_at: entry.closedAt ? toUnixTimestamp(entry.closedAt) : undefined,
    close_price: entry.closePrice ? toPreciseString(entry.closePrice) : undefined,
    pnl: entry.pnl ? toPreciseString(entry.pnl) : undefined,
    status: entry.status
  };
}

/**
 * トレードエントリーの損益計算
 * @param entry トレードエントリー
 * @param currentPrice 現在の価格（指定がなければclosePrice）
 * @returns 損益額
 */
export function calculatePnL(entry: TradeEntry, currentPrice?: number): number {
  // エントリーがない場合は0
  if (!entry || !entry.price || !entry.amount) return 0;
  
  // 現在価格が指定されていなければ、決済価格を使用（なければエントリー価格）
  const price = currentPrice || entry.closePrice || entry.price;
  
  // 価格差
  const priceDiff = entry.side === 'buy' 
    ? price - entry.price   // 買いの場合: 現在価格 - エントリー価格
    : entry.price - price;  // 売りの場合: エントリー価格 - 現在価格
  
  // 損益計算（レバレッジ考慮）
  const leverage = entry.leverage || 1;
  const rawPnL = priceDiff * entry.amount;
  
  // レバレッジ効果を適用
  return rawPnL * leverage;
}

/**
 * トレードエントリーの損益率計算（パーセンテージ）
 * @param entry トレードエントリー
 * @param currentPrice 現在の価格（指定がなければclosePrice）
 * @returns 損益率（小数表現、例: 0.05 = 5%）
 */
export function calculatePnLPercent(entry: TradeEntry, currentPrice?: number): number {
  // エントリーがない場合は0
  if (!entry || !entry.price || !entry.amount) return 0;
  
  // 投資額
  const investment = entry.price * entry.amount;
  if (investment === 0) return 0;
  
  // 損益額を計算
  const pnl = calculatePnL(entry, currentPrice);
  
  // 損益率を返す（小数表現）
  return pnl / investment;
} 