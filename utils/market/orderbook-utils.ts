// utils/market/orderbook-utils.ts
// 作成: オーダーブックデータの変換ユーティリティ関数
// OrderBookEntry型と配列形式[string, string][]の相互変換を行います
// 更新: T-7.8フェーズ - 型インポートパスを修正し、型安全性を向上

import { OrderBookData, OrderBookEntry } from '@/types/chart/orderbook';

/**
 * 配列形式のオーダーブックエントリー[string, string]をOrderBookEntry型に変換
 * @param entry 配列形式のエントリー [価格, 数量]
 * @returns OrderBookEntry型のオブジェクト
 */
export function arrayToOrderBookEntry(entry: [string, string]): OrderBookEntry {
  return {
    price: parseFloat(entry[0]),
    amount: parseFloat(entry[1])
  };
}

/**
 * OrderBookEntry型のオブジェクトを配列形式[string, string]に変換
 * @param entry OrderBookEntry型のオブジェクト
 * @returns 配列形式のエントリー [価格, 数量]
 */
export function orderBookEntryToArray(entry: OrderBookEntry): [string, string] {
  return [entry.price.toString(), entry.amount.toString()];
}

/**
 * オーダーブックデータの配列要素が配列形式かどうかを判定
 * @param data オーダーブックデータの配列要素
 * @returns 配列形式の場合はtrue、OrderBookEntry型の場合はfalse
 */
export function isArrayFormat(data: OrderBookEntry | [string, string]): data is [string, string] {
  return Array.isArray(data);
}

/**
 * オーダーブックデータから価格を取得（どちらの形式でも対応）
 * @param entry オーダーブックエントリー（OrderBookEntryまたは[string, string]）
 * @returns 価格（数値）
 */
export function getPrice(entry: OrderBookEntry | [string, string]): number {
  if (isArrayFormat(entry)) {
    return parseFloat(entry[0]);
  }
  return entry.price;
}

/**
 * オーダーブックデータから数量を取得（どちらの形式でも対応）
 * @param entry オーダーブックエントリー（OrderBookEntryまたは[string, string]）
 * @returns 数量（数値）
 */
export function getAmount(entry: OrderBookEntry | [string, string]): number {
  if (isArrayFormat(entry)) {
    return parseFloat(entry[1]);
  }
  return entry.amount;
}

/**
 * オーダーブックデータを標準形式に変換
 * 配列形式[string, string][]の場合はOrderBookEntry[]に変換
 * @param data オーダーブックデータ
 * @returns 標準化されたオーダーブックデータ
 */
export function normalizeOrderBookData(data: OrderBookData): OrderBookData {
  if (!data) return data;
  
  const normalizedData: OrderBookData = {
    ...data,
    asks: Array.isArray(data.asks) && data.asks.length > 0 
      ? (isArrayFormat(data.asks[0]) 
          ? (data.asks as [string, string][]).map(arrayToOrderBookEntry)
          : data.asks as OrderBookEntry[])
      : [],
    bids: Array.isArray(data.bids) && data.bids.length > 0
      ? (isArrayFormat(data.bids[0])
          ? (data.bids as [string, string][]).map(arrayToOrderBookEntry)
          : data.bids as OrderBookEntry[])
      : []
  };
  
  return normalizedData;
}
