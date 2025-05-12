/**
 * services/data/dataFetchTypes.ts
 * データフェッチサービスの型定義
 * 
 * 作成: データフェッチサービスのインターフェースと型定義
 */

import { ExchangeType } from '../../types/api';
import { OrderBookData } from '../../types/market';
import { OHLCData, Timeframe } from '../../types/chart';

export interface IDataFetchService {
  /**
   * オーダーブックデータ取得
   * @param symbol シンボル
   * @param exchangeType 取引タイプ
   * @param signal AbortSignal
   * @param useCache キャッシュを使用するかどうか
   * @returns オーダーブックデータ
   */
  fetchOrderBook(
    symbol: string,
    exchangeType: ExchangeType,
    signal?: AbortSignal,
    useCache?: boolean
  ): Promise<OrderBookData>;
  
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
   * シンボル変更時にキャッシュをクリア
   * @param newSymbol 新しいシンボル
   */
  handleSymbolChange(newSymbol: string): void;
  
  /**
   * 時間足変更時にキャッシュをクリア
   * @param symbol シンボル
   * @param newTimeframe 新しいタイムフレーム
   * @param exchangeType 取引タイプ
   */
  handleTimeframeChange(
    symbol: string, 
    newTimeframe: Timeframe, 
    exchangeType?: ExchangeType
  ): void;
}
