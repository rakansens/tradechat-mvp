/**
 * services/data/interfaces.ts
 * データサービスのインターフェース定義
 * 
 * 作成: 2025-05-12 - SRPに基づくリファクタリングの一環として
 * 各サービスのインターフェースを明確に定義
 */

import { ExchangeType } from '@/types/api';
import { OHLCData, Timeframe, OrderBookData } from '../../types/chart';

/**
 * オーダーブックサービスのインターフェース
 * オーダーブックデータの取得と管理を担当
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
   * WebSocketを使用してオーダーブックデータをリアルタイム購読
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
   * すべてのオーダーブック購読を解除
   */
  unsubscribeAllOrderBooks(): void;
}

/**
 * チャートデータサービスのインターフェース
 * チャートデータの取得と管理を担当
 */
export interface IChartDataService {
  /**
   * チャートデータ取得
   * @param symbol シンボル
   * @param timeFrame タイムフレーム
   * @param exchangeType 取引タイプ
   * @param signal AbortSignal
   * @param useCache キャッシュを使用するかどうか
   * @returns チャートデータの配列
   */
  fetchChartData(
    symbol: string,
    timeFrame: Timeframe,
    exchangeType: ExchangeType,
    signal?: AbortSignal,
    useCache?: boolean
  ): Promise<OHLCData[]>;
  
  /**
   * WebSocketを使用してローソク足データをリアルタイム購読
   * @param symbol シンボル
   * @param timeFrame タイムフレーム
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ
   * @returns 購読解除用の関数
   */
  subscribeKlineRealtime(
    symbol: string,
    timeFrame: Timeframe,
    callback: (data: OHLCData) => void,
    exchangeType?: ExchangeType
  ): () => void;
  
  /**
   * すべてのチャートデータ購読を解除
   */
  unsubscribeAllKlines(): void;
  
  /**
   * シンボル変更時にキャッシュをクリア
   * @param newSymbol 新しいシンボル
   */
  clearCacheOnSymbolChange(newSymbol: string): void;
}

/**
 * @deprecated 代わりにIOrderBookServiceとIChartDataServiceを使用してください
 */
export interface IDataFetchService extends IChartDataService {
  // オーダーブック関連のメソッドはIOrderBookServiceに移行しました
}
