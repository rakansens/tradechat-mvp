/**
 * services/api/interfaces.ts
 * API関連のインターフェース定義
 * 
 * 作成: 2025-05-12 - SRPに基づいたインターフェース設計
 * 更新: 2025-05-12 - オーダーブックサービスのインターフェースを追加
 * 
 * このファイルは、APIクライアントのインターフェースを定義します。
 * 単一責任の原則（SRP）に基づき、各インターフェースは明確に分離された責任を持ちます。
 */

import { ExchangeType } from '../../types/api';
import { OHLCData, OrderBookData, Timeframe } from '../../types/chart';

/**
 * WebSocketクライアントインターフェース
 * WebSocketを使用したリアルタイムデータの取得に責任を持つ
 */
export interface IWebSocketClient {
  /**
   * WebSocket接続を確立
   */
  connect(): Promise<void>;
  
  /**
   * WebSocket接続を閉じる
   */
  disconnect(): void;
  
  /**
   * オーダーブックデータを購読
   * @param symbol シンボル
   * @returns 購読解除用の関数
   */
  subscribeOrderBook(symbol: string): () => void;
  
  /**
   * ローソク足データを購読
   * @param symbol シンボル
   * @param timeframe タイムフレーム
   * @returns 購読解除用の関数
   */
  subscribeCandles(symbol: string, timeframe: Timeframe): () => void;
  
  /**
   * イベントリスナーを登録
   * @param event イベント名
   * @param listener リスナー関数
   */
  on(event: string, listener: (...args: any[]) => void): void;
  
  /**
   * イベントリスナーを削除
   * @param event イベント名
   * @param listener リスナー関数
   */
  off(event: string, listener: (...args: any[]) => void): void;
}

/**
 * REST APIクライアントインターフェース
 * HTTP APIを使用した過去データの取得に責任を持つ
 */
export interface IRestApiClient {
  /**
   * オーダーブックデータを取得
   * @param symbol シンボル
   * @param exchangeType 取引タイプ
   * @returns オーダーブックデータ
   */
  getOrderBook(symbol: string, exchangeType: ExchangeType): Promise<OrderBookData>;
  
  /**
   * 過去のローソク足データを取得
   * @param symbol シンボル
   * @param timeframe タイムフレーム
   * @param limit 取得件数
   * @returns ローソク足データの配列
   */
  getHistoricalCandles(
    symbol: string,
    timeframe: Timeframe,
    limit?: number
  ): Promise<OHLCData[]>;
}

/**
 * チャートデータサービスインターフェース
 * チャートデータの取得と管理に責任を持つ
 */
export interface IChartDataService {
  /**
   * チャートデータを取得（ハイブリッドアプローチ）
   * @param symbol シンボル
   * @param timeframe タイムフレーム
   * @param exchangeType 取引タイプ
   * @param limit 取得件数
   * @returns チャートデータの配列
   */
  getChartData(
    symbol: string,
    timeframe: Timeframe,
    exchangeType?: ExchangeType,
    limit?: number
  ): Promise<OHLCData[]>;
  
  /**
   * オーダーブックデータを取得
   * @param symbol シンボル
   * @param exchangeType 取引タイプ
   * @returns オーダーブックデータ
   */
  getOrderBook(symbol: string, exchangeType: ExchangeType): Promise<OrderBookData>;
  
  /**
   * リアルタイムチャートデータを購読
   * @param symbol シンボル
   * @param timeframe タイムフレーム
   * @param callback コールバック関数
   * @returns 購読解除用の関数
   */
  subscribeRealtimeChartData(
    symbol: string,
    timeframe: Timeframe,
    callback: (data: OHLCData) => void
  ): () => void;
  
  /**
   * すべての購読を解除
   */
  unsubscribeAll(): void;
}

/**
 * データソースファクトリーインターフェース
 * 適切なデータソースの作成に責任を持つ
 */
export interface IDataSourceFactory {
  /**
   * WebSocketクライアントを取得
   * @param exchange 取引所名
   * @returns WebSocketクライアント
   */
  getWebSocketClient(exchange?: string): IWebSocketClient;
  
  /**
   * REST APIクライアントを取得
   * @param exchange 取引所名
   * @returns REST APIクライアント
   */
  getRestApiClient(exchange?: string): IRestApiClient;
}

/**
 * オーダーブックサービスインターフェース
 * オーダーブックデータの取得と管理に責任を持つ
 */
export interface IOrderBookService {
  /**
   * オーダーブックデータを取得
   * @param symbol シンボル
   * @param exchangeType 取引タイプ
   * @param signal AbortSignal
   * @returns オーダーブックデータ
   */
  getOrderBook(
    symbol: string,
    exchangeType: ExchangeType,
    signal?: AbortSignal
  ): Promise<OrderBookData>;
  
  /**
   * オーダーブックデータをリアルタイムで購読
   * @param symbol シンボル
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ
   * @returns 購読解除用の関数
   */
  subscribeOrderBookRealtime(
    symbol: string,
    callback: (data: OrderBookData) => void,
    exchangeType?: ExchangeType
  ): () => void;
  
  /**
   * すべての購読を解除
   */
  unsubscribeAll(): void;
}

/**
 * キャッシュサービスインターフェース
 * データのキャッシュに責任を持つ
 */
export interface ICacheService<T = any> {
  /**
   * データを取得
   * @param key キー
   * @returns キャッシュされたデータ
   */
  get<U = T>(key: string): U | null;
  
  /**
   * データを保存
   * @param key キー
   * @param data データ
   * @param source データソース
   * @param ttl 有効期限（秒）
   */
  set<U = T>(key: string, data: U, source?: string, ttl?: number): void;
  
  /**
   * データを削除
   * @param key キー
   */
  delete(key: string): void;
  
  /**
   * キーに基づいてデータを削除
   * @param pattern キーのパターン
   */
  deleteByPattern(pattern: string): void;
}
