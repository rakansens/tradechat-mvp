/**
 * WebSocketメッセージの型定義とZodスキーマ
 * 
 * このファイルはWebSocketメッセージに関連する型定義を集約しています。
 * - WebSocketのメッセージ型
 * - チャンネル購読関連の型
 * - Zodスキーマによるバリデーション
 */

import { z } from 'zod';
import { ExchangeType } from './api';

// WebSocketメッセージタイプの定義
export enum WebSocketMessageType {
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  ORDERBOOK = 'orderbook',
  KLINE = 'kline',
  TRADE = 'trade',
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong'
}

// WebSocketチャンネルタイプの定義
export enum WebSocketChannelType {
  ORDERBOOK = 'orderbook',
  KLINE = 'kline',
  TRADE = 'trade'
}

// WebSocketサブスクリプションの型定義
export interface WebSocketSubscription {
  symbol: string;
  type: WebSocketChannelType;
  timeframe?: string; // KLINEチャンネルの場合のみ使用
  exchangeType: ExchangeType;
  clientId: string;
}

// WebSocketメッセージの基本インターフェース
export interface WebSocketMessage {
  type: WebSocketMessageType;
  timestamp: number;
}

// サブスクリプションメッセージの型定義
export interface SubscriptionMessage extends WebSocketMessage {
  type: WebSocketMessageType.SUBSCRIBE | WebSocketMessageType.UNSUBSCRIBE;
  channel: WebSocketChannelType;
  symbol: string;
  timeframe?: string;
  exchangeType: ExchangeType;
  clientId: string;
}

// オーダーブックメッセージの型定義
export interface OrderBookMessage extends WebSocketMessage {
  type: WebSocketMessageType.ORDERBOOK;
  symbol: string;
  exchangeType: ExchangeType;
  data: {
    asks: Array<[string, string]>; // [価格, 数量]
    bids: Array<[string, string]>; // [価格, 数量]
    timestamp: number;
  };
}

// ローソク足メッセージの型定義
export interface KlineMessage extends WebSocketMessage {
  type: WebSocketMessageType.KLINE;
  symbol: string;
  timeframe: string;
  exchangeType: ExchangeType;
  data: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  };
}

// 取引メッセージの型定義
export interface TradeMessage extends WebSocketMessage {
  type: WebSocketMessageType.TRADE;
  symbol: string;
  exchangeType: ExchangeType;
  data: {
    id: string;
    price: number;
    amount: number;
    side: 'buy' | 'sell';
    timestamp: number;
  };
}

// エラーメッセージの型定義
export interface ErrorMessage extends WebSocketMessage {
  type: WebSocketMessageType.ERROR;
  code: string;
  message: string;
}

// Ping/Pongメッセージの型定義
export interface PingPongMessage extends WebSocketMessage {
  type: WebSocketMessageType.PING | WebSocketMessageType.PONG;
}

// WebSocketメッセージの共用型
export type WebSocketMessageUnion = 
  | SubscriptionMessage
  | OrderBookMessage
  | KlineMessage
  | TradeMessage
  | ErrorMessage
  | PingPongMessage;

// Zodスキーマ定義

// 基本的なWebSocketメッセージスキーマ
export const webSocketMessageSchema = z.object({
  type: z.nativeEnum(WebSocketMessageType),
  timestamp: z.number()
});

// サブスクリプションメッセージスキーマ
export const subscriptionMessageSchema = webSocketMessageSchema.extend({
  type: z.enum([WebSocketMessageType.SUBSCRIBE, WebSocketMessageType.UNSUBSCRIBE]),
  channel: z.nativeEnum(WebSocketChannelType),
  symbol: z.string(),
  timeframe: z.string().optional(),
  exchangeType: z.enum(['spot', 'futures']),
  clientId: z.string()
});

// オーダーブックメッセージスキーマ
export const orderBookMessageSchema = webSocketMessageSchema.extend({
  type: z.literal(WebSocketMessageType.ORDERBOOK),
  symbol: z.string(),
  exchangeType: z.enum(['spot', 'futures']),
  data: z.object({
    asks: z.array(z.tuple([z.string(), z.string()])),
    bids: z.array(z.tuple([z.string(), z.string()])),
    timestamp: z.number()
  })
});

// ローソク足メッセージスキーマ
export const klineMessageSchema = webSocketMessageSchema.extend({
  type: z.literal(WebSocketMessageType.KLINE),
  symbol: z.string(),
  timeframe: z.string(),
  exchangeType: z.enum(['spot', 'futures']),
  data: z.object({
    time: z.number(),
    open: z.number(),
    high: z.number(),
    low: z.number(),
    close: z.number(),
    volume: z.number()
  })
});

// 取引メッセージスキーマ
export const tradeMessageSchema = webSocketMessageSchema.extend({
  type: z.literal(WebSocketMessageType.TRADE),
  symbol: z.string(),
  exchangeType: z.enum(['spot', 'futures']),
  data: z.object({
    id: z.string(),
    price: z.number(),
    amount: z.number(),
    side: z.enum(['buy', 'sell']),
    timestamp: z.number()
  })
});

// エラーメッセージスキーマ
export const errorMessageSchema = webSocketMessageSchema.extend({
  type: z.literal(WebSocketMessageType.ERROR),
  code: z.string(),
  message: z.string()
});

// Ping/Pongメッセージスキーマ
export const pingPongMessageSchema = webSocketMessageSchema.extend({
  type: z.enum([WebSocketMessageType.PING, WebSocketMessageType.PONG])
});

// WebSocketメッセージの共用スキーマ
export const webSocketMessageUnionSchema = z.discriminatedUnion('type', [
  subscriptionMessageSchema,
  orderBookMessageSchema,
  klineMessageSchema,
  tradeMessageSchema,
  errorMessageSchema,
  pingPongMessageSchema
]);

// バリデーション関数
export function validateWebSocketMessage(data: unknown): z.SafeParseReturnType<any, any> {
  return webSocketMessageUnionSchema.safeParse(data);
}

// サブスクリプションメッセージのバリデーション関数
export function validateSubscriptionMessage(data: unknown): z.SafeParseReturnType<any, any> {
  return subscriptionMessageSchema.safeParse(data);
}

// オーダーブックメッセージのバリデーション関数
export function validateOrderBookMessage(data: unknown): z.SafeParseReturnType<any, any> {
  return orderBookMessageSchema.safeParse(data);
}

// ローソク足メッセージのバリデーション関数
export function validateKlineMessage(data: unknown): z.SafeParseReturnType<any, any> {
  return klineMessageSchema.safeParse(data);
}

// 取引メッセージのバリデーション関数
export function validateTradeMessage(data: unknown): z.SafeParseReturnType<any, any> {
  return tradeMessageSchema.safeParse(data);
}

// エラーメッセージのバリデーション関数
export function validateErrorMessage(data: unknown): z.SafeParseReturnType<any, any> {
  return errorMessageSchema.safeParse(data);
}

// Ping/Pongメッセージのバリデーション関数
export function validatePingPongMessage(data: unknown): z.SafeParseReturnType<any, any> {
  return pingPongMessageSchema.safeParse(data);
} 