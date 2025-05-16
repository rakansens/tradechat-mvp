/**
 * utils/channelKey.ts
 * ソケット通信のチャンネル名と購読キーの生成を行うユーティリティ
 */

import { ExchangeType } from '../types/api';
import { ChannelName } from '../server/socketDataBroadcaster';

/**
 * チャンネルキーの構成要素
 */
export interface ChannelKeyComponents {
  type: ChannelName;
  symbol: string;
  timeframe?: string;
  exchangeType: ExchangeType;
}

/**
 * 均一なチャンネルキーを生成する
 * 
 * @param components チャンネルキーの構成要素
 * @returns フォーマットされたチャンネルキー
 */
export function buildChannelKey(components: ChannelKeyComponents): string {
  const { type, symbol, timeframe, exchangeType } = components;
  
  // 欠損値がある場合は明示的に空文字を使う (timeframeがundefinedでも安全)
  return `${type}:${symbol}:${timeframe || ''}:${exchangeType}`;
}

/**
 * サブスクリプション情報からチャンネルキーの構成要素を生成
 * 
 * @param type チャンネルタイプ
 * @param symbol シンボル
 * @param timeframe タイムフレーム
 * @param exchangeType 取引タイプ
 * @returns チャンネルキーの構成要素
 */
export function createChannelKeyComponents(
  type: ChannelName,
  symbol: string,
  timeframe?: string,
  exchangeType: ExchangeType = 'spot'
): ChannelKeyComponents {
  return {
    type,
    symbol,
    timeframe,
    exchangeType
  };
}

/**
 * チャンネル名の生成
 * 
 * @param components チャンネルキーの構成要素
 * @returns チャンネル名
 */
export function getChannelName(components: ChannelKeyComponents): string {
  return buildChannelKey(components);
}

/**
 * キャッシュキーの生成
 * 
 * @param components チャンネルキーの構成要素
 * @returns キャッシュキー
 */
export function getCacheKey(components: ChannelKeyComponents): string {
  return buildChannelKey(components);
}

export default {
  buildChannelKey,
  createChannelKeyComponents,
  getChannelName,
  getCacheKey
}; 