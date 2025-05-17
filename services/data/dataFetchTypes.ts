/**
 * services/data/dataFetchTypes.ts
 * データフェッチサービスの型定義
 * 
 * 作成: データフェッチサービスのインターフェースと型定義
 */

import { ExchangeType } from '@/types/api';
import { OHLCData, Timeframe } from '../../types/chart';

export interface IDataFetchService {
  // オーダーブック関連のメソッドはIOrderBookServiceに移行しました
  
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
  
  // オーダーブックのリアルタイム購読機能はIOrderBookServiceに移行しました
  
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
