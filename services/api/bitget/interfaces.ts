/**
 * services/api/bitget/interfaces.ts
 * Bitget APIクライアントのインターフェース定義
 * 
 * 作成: 2025-05-12 - BitgetApiClientのリファクタリングに伴うインターフェース定義
 * 
 * このファイルは、BitgetApiClientのインターフェースを定義します。
 * 既存の実装との互換性を保ちながら、段階的なリファクタリングを可能にします。
 */

import { ExchangeType, BitgetCredentials } from '../../../types/api';
import { OHLCData } from '../../../types/chart';
import { OrderBookData } from '../../../types/market';
import { IRestApiClient, IWebSocketClient } from '../interfaces';

/**
 * BitgetApiClientのオプション
 */
export interface BitgetApiClientOptions {
  /**
   * API認証情報
   */
  credentials?: BitgetCredentials;
  
  /**
   * API基本URL（デフォルト: 環境設定から取得）
   */
  baseUrl?: string;
  
  /**
   * WebSocket URL（デフォルト: 環境設定から取得）
   */
  wsUrl?: string;
  
  /**
   * エラー時にデモモードを有効にするかどうか
   */
  enableDemoMode?: boolean;
}

/**
 * BitgetApiClientインターフェース
 * 既存の実装との互換性を保ちつつ、段階的なリファクタリングを可能にする
 */
export interface IBitgetApiClient {
  /**
   * REST APIクライアントを取得
   */
  getRestClient(): IRestApiClient;
  
  /**
   * WebSocketクライアントを取得
   */
  getWebSocketClient(): IWebSocketClient;
  
  /**
   * ローソク足データを取得
   * @param symbol シンボル
   * @param timeframe タイムフレーム
   * @param limit 取得件数
   * @param type 取引タイプ
   * @returns ローソク足データの配列
   */
  fetchCandles(
    symbol: string,
    timeframe: string,
    limit?: number,
    type?: ExchangeType
  ): Promise<OHLCData[]>;
  
  /**
   * オーダーブックデータを取得
   * @param symbol シンボル
   * @param limit 取得件数
   * @param type 取引タイプ
   * @returns オーダーブックデータ
   */
  fetchOrderBook(
    symbol: string,
    limit?: number,
    type?: ExchangeType
  ): Promise<OrderBookData>;
  
  /**
   * WebSocket接続を確立
   */
  connectWebSocket(): void;
  
  /**
   * WebSocket接続を閉じる
   */
  disconnectWebSocket(): void;
  
  /**
   * オーダーブックデータを購読
   * @param symbol シンボル
   * @param callback コールバック関数
   * @returns 購読解除用の関数
   */
  subscribeOrderBook(
    symbol: string,
    callback: (data: OrderBookData) => void
  ): () => void;
  
  /**
   * ローソク足データを購読
   * @param symbol シンボル
   * @param timeframe タイムフレーム
   * @param callback コールバック関数
   * @returns 購読解除用の関数
   */
  subscribeCandles(
    symbol: string,
    timeframe: string,
    callback: (data: OHLCData) => void
  ): () => void;
}
