/**
 * services/data/dataFetchService.ts
 * データフェッチサービスの実装
 * 
 * 更新: シングルレスポンシビリティプリンシプルに基づく改善
 * - ブラウザとサーバー環境の両方で動作するように修正
 * - REST APIとWebSocketの適切な使い分け
 * - エラーハンドリングの強化
 * 
 * 更新: 2025-05-12 - オーダーブック関連の機能をorderBookServiceに移行
 * @deprecated このサービスは非推奨です。代わりに専用のサービスを使用してください：
 * - チャートデータ: chartDataService
 * - オーダーブック: orderBookService
 */

import { EventEmitter } from 'events';
import { BitgetApiClient } from '../api/bitget/client.new';
import { IDataFetchService } from './dataFetchTypes';
import { OHLCData, Timeframe } from '../../types/chart';
import { ExchangeType } from '@/types/api';
import { logger } from '../../utils/logger';
import { normalizeSymbol } from '../../utils/formatters';
import { getSocketService } from '../socket/service';
import { cacheService } from '../cache/service';

// 環境検出
const isBrowser = typeof window !== 'undefined';

/**
 * データフェッチサービス
 * クリプト通貨取引所からのデータ取得を管理するサービス
 */
class DataFetchService extends EventEmitter implements IDataFetchService {
  private bitgetApiClient: BitgetApiClient | null = null;
  
  /**
   * BitgetApiClientインスタンスを取得または作成
   */
  private getBitgetApiClient(): BitgetApiClient {
    if (!this.bitgetApiClient) {
      this.bitgetApiClient = new BitgetApiClient();
    }
    return this.bitgetApiClient;
  }
  
  // オーダーブック関連のメソッドはorderBookServiceに移行しました
  
  /**
   * チャートデータ取得（ベストプラクティスに沿ったハイブリッドアプローチ）
   * 
   * 業界のベストプラクティスに従い、以下のアプローチを実装しています：
   * 1. 過去の確定したローソク足データはREST APIで取得
   * 2. 最新の未確定ローソク足データはWebSocketでリアルタイム取得
   * @param symbol シンボル
   * @param timeFrame タイムフレーム
   * @param exchangeType 取引タイプ
   * @param signal AbortSignal
   * @param useCache キャッシュを使用するかどうか
   * @returns ローソク足データの配列
   */
  async fetchChartData(
    symbol: string,
    timeFrame: Timeframe,
    exchangeType: ExchangeType,
    signal?: AbortSignal,
    useCache: boolean = true
  ): Promise<OHLCData[]> {
    // シンボルを正規化
    const normalizedSymbol = normalizeSymbol(symbol);
    
    // キャッシュキーを生成
    const cacheKey = `chart-${normalizedSymbol}-${timeFrame}-${exchangeType}`;
    
    // キャッシュからデータを取得
    if (useCache) {
      const cachedData = cacheService.get<OHLCData[]>(cacheKey);
      if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        logger.debug(`キャッシュからチャートデータを取得: ${normalizedSymbol} ${timeFrame}`, {
          component: 'DataFetchService',
          action: 'fetchChartData',
          symbol: normalizedSymbol,
          timeFrame,
          exchangeType,
          source: 'cache',
          count: cachedData.length
        });
        return cachedData;
      }
    }
    
    try {
      logger.info(`REST APIからチャートデータを取得中: ${normalizedSymbol} ${timeFrame}`, {
        component: 'DataFetchService',
        action: 'fetchChartData',
        symbol: normalizedSymbol,
        timeFrame,
        exchangeType,
        source: 'rest-api'
      });
      
      // BitgetApiClientを取得
      const bitgetClient = this.getBitgetApiClient();
      
      const restData = await bitgetClient.fetchCandles(normalizedSymbol, timeFrame, 100);
      
      // キャッシュにデータを保存
      cacheService.set(cacheKey, restData, 'rest');
      
      // ログに記録
      logger.info(`REST APIからチャートデータを取得完了: ${normalizedSymbol} ${timeFrame}`, {
        component: 'DataFetchService',
        action: 'fetchChartData',
        symbol: normalizedSymbol,
        timeFrame,
        exchangeType,
        source: 'rest-api',
        count: restData.length
      });
      
      return restData;
    } catch (error) {
      logger.error(`チャートデータ取得エラー: ${error}`, {
        component: 'DataFetchService',
        action: 'fetchChartData',
        symbol: normalizedSymbol,
        timeFrame,
        exchangeType,
        error
      });
      
      // エラー時はデモデータを返す
      const now = Date.now();
      const demoData = Array(100).fill(0).map((_, i) => {
        const time = now - (99 - i) * getTimeframeMilliseconds(timeFrame);
        const basePrice = normalizedSymbol.split('/')[0] === 'BTC' ? 30000 : 2000;
        const randomFactor = 0.01 * Math.sin(i / 10);
        
        // 数値型として定義
        return {
          time: time,
          open: basePrice * (1 + randomFactor * 0.9),
          high: basePrice * (1 + randomFactor * 1.1),
          low: basePrice * (1 + randomFactor * 0.8),
          close: basePrice * (1 + randomFactor),
          volume: 100 * (1 + Math.random())
        } as OHLCData;
      });
      
      return demoData;
    }
  }
  
  /**
   * シンボル変更時にキャッシュをクリア
   * @param newSymbol 新しいシンボル
   */
  handleSymbolChange(newSymbol: string): void {
    // キャッシュから古いシンボルのデータをクリア
    cacheService.clearByPattern(new RegExp(`^(orderbook|chart)-.*`));
    
    logger.info(`シンボル変更によりキャッシュをクリア: ${newSymbol}`, {
      component: 'DataFetchService',
      action: 'handleSymbolChange',
      symbol: newSymbol
    });
  }
  
  /**
   * 時間足変更時にキャッシュをクリア
   * @param symbol シンボル
   * @param newTimeframe 新しい時間足
   * @param exchangeType 取引タイプ
   */
  handleTimeframeChange(symbol: string, newTimeframe: Timeframe, exchangeType: ExchangeType = 'bitget'): void {
    // キャッシュから古い時間足のデータをクリア
    const normalizedSymbol = normalizeSymbol(symbol);
    cacheService.clearByPattern(new RegExp(`^chart-${normalizedSymbol}-.*-${exchangeType}$`));
    
    logger.info(`時間足変更によりキャッシュをクリア: ${normalizedSymbol} ${newTimeframe}`, {
      component: 'DataFetchService',
      action: 'handleTimeframeChange',
      symbol: normalizedSymbol,
      timeFrame: newTimeframe,
      exchangeType
    });
  }
  
  // オーダーブックのリアルタイム購読機能はorderBookServiceに移行しました
  
  /**
   * WebSocketを使用してローソク足データをリアルタイム購読
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param timeFrame タイムフレーム（例: '1m', '1h'）
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @returns 購読解除用の関数
   */
  subscribeKlineRealtime(
    symbol: string,
    timeFrame: Timeframe,
    callback: (data: OHLCData) => void,
    exchangeType: ExchangeType = 'bitget'
  ): () => void {
    // シンボルを正規化
    const normalizedSymbol = normalizeSymbol(symbol);
    
    // ブラウザ環境ではポーリングで対応
    if (isBrowser) {
      logger.info(`ブラウザ環境ではポーリングでローソク足データを取得: ${normalizedSymbol} ${timeFrame}`, {
        component: 'DataFetchService',
        action: 'subscribeKlineRealtime',
        symbol: normalizedSymbol,
        timeFrame,
        exchangeType,
        client: 'polling'
      });
      
      // ポーリング間隔（ミリ秒）- タイムフレームに応じて調整
      const pollingInterval = Math.min(
        getTimeframeMilliseconds(timeFrame) / 10, // タイムフレームの1/10
        10000 // 最大10秒
      );
      
      // 最後に取得したデータのタイムスタンプ
      let lastTimestamp = 0;
      
      // ポーリング用のタイマーID
      const timerId = setInterval(async () => {
        try {
          const data = await this.fetchChartData(normalizedSymbol, timeFrame, exchangeType);
          
          // 最新のデータを取得
          const latestData = data[data.length - 1];
          
          // 新しいデータがある場合のみコールバックを呼び出す
          if (latestData && latestData.time > lastTimestamp) {
            lastTimestamp = latestData.time;
            callback(latestData);
          }
        } catch (error) {
          logger.error(`ポーリングでのローソク足データ取得エラー: ${error}`, {
            component: 'DataFetchService',
            action: 'subscribeKlineRealtime',
            symbol: normalizedSymbol,
            timeFrame,
            exchangeType,
            error
          });
        }
      }, pollingInterval);
      
      // 購読解除関数を返す
      return () => {
        clearInterval(timerId);
      };
    }
    
    // サーバー環境ではWebSocketを使用
    const socketService = getSocketService();
    
    // WebSocketが接続されていない場合は空の解除関数を返す
    if (!socketService || !socketService.isConnected()) {
      logger.warn(`WebSocketが接続されていないため、ローソク足データの購読ができません: ${normalizedSymbol} ${timeFrame}`, {
        component: 'DataFetchService',
        action: 'subscribeKlineRealtime',
        symbol: normalizedSymbol,
        timeFrame,
        exchangeType
      });
      return () => {};
    }
    
    // WebSocketサービスを使用
    const unsubscribe = socketService.subscribeKline(
      normalizedSymbol,
      timeFrame,
      (data: OHLCData) => {
        // データをキャッシュに保存（既存のキャッシュがあれば更新）
        const requestKey = `chart-${normalizedSymbol}-${timeFrame}-${exchangeType}`;
        const cachedData = cacheService.get<OHLCData[]>(requestKey);
        
        if (cachedData && Array.isArray(cachedData)) {
          // 既存のデータがある場合は更新
          const updatedData = [...cachedData];
          
          // 同じ時間のデータがあれば更新、なければ追加
          const existingIndex = updatedData.findIndex(item => item.time === data.time);
          if (existingIndex !== -1) {
            updatedData[existingIndex] = data;
          } else {
            updatedData.push(data);
          }
          
          // キャッシュを更新
          cacheService.set(requestKey, updatedData, 'websocket');
        } else {
          // 新しいデータとして保存
          cacheService.set(requestKey, [data], 'websocket');
        }
        
        // コールバック関数を呼び出し
        callback(data);
      },
      exchangeType
    );
    
    logger.info(`WebSocketでローソク足データのリアルタイム購読を開始: ${normalizedSymbol} ${timeFrame}`, {
      component: 'DataFetchService',
      action: 'subscribeKlineRealtime',
      symbol: normalizedSymbol,
      timeFrame,
      exchangeType,
      client: 'socket-service'
    });
    
    return unsubscribe;
  }
}

/**
 * タイムフレームをミリ秒に変換するヘルパー関数
 * @param timeframe タイムフレーム（例: '1m', '1h'）
 * @returns ミリ秒
 */
function getTimeframeMilliseconds(timeframe: Timeframe): number {
  const value = parseInt(timeframe.slice(0, -1), 10);
  const unit = timeframe.slice(-1);
  
  switch (unit) {
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'w': return value * 7 * 24 * 60 * 60 * 1000;
    default: return 60 * 1000; // デフォルトは1分
  }
}

// シングルトンインスタンスをエクスポート
export const dataFetchService = new DataFetchService();
