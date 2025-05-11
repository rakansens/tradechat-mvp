/**
 * services/data/dataFetchService.ts
 * データフェッチサービスの実装
 * 
 * 作成: リファクタリングされたデータフェッチサービスの実装
 */

import { BitgetApiClient } from '../bitgetApi';
import { ExchangeType } from '../../types/api';
import { OrderBookData } from '../../types/market';
import { OHLCData, Timeframe } from '../../types/chart';
import { logger } from '../../utils/logger';
import { normalizeSymbol } from '../../lib/utils';
import { getSocketService } from '../socket';
import { cacheService } from '../cache';
import { requestHistoryService } from '../history';
import { IDataFetchService } from './dataFetchTypes';

export class DataFetchService implements IDataFetchService {
  /**
   * オーダーブックデータ取得（WebSocketとRESTAPIのハイブリッド）
   */
  async fetchOrderBook(
    symbol: string,
    exchangeType: ExchangeType,
    signal?: AbortSignal,
    useCache: boolean = true
  ): Promise<OrderBookData> {
    // 共通のnormalizeSymbol関数を使用してシンボルを正規化
    const normalizedSymbol = normalizeSymbol(symbol);
    
    const requestKey = `orderbook-${normalizedSymbol}-${exchangeType}`;
    
    // キャッシュをチェック
    if (useCache) {
      const cachedData = cacheService.get<OrderBookData>(requestKey);
      if (cachedData) {
        return cachedData;
      }
    }
    
    try {
      // WebSocketサービスを取得
      const socketService = getSocketService();
      
      // WebSocketが接続されているか確認
      if (socketService && socketService.isConnected()) {
        try {
          // WebSocketからデータを取得（Promise化）
          const wsData = await new Promise<OrderBookData>((resolve, reject) => {
            // タイムアウト設定
            const timeoutId = setTimeout(() => {
              reject(new Error('WebSocketからのデータ取得がタイムアウトしました'));
            }, 5000); // 5秒でタイムアウト
            
            // 一時的なサブスクリプション
            const unsubscribe = socketService.subscribeOrderBook(
              normalizedSymbol,
              (data: OrderBookData) => {
                clearTimeout(timeoutId);
                unsubscribe(); // 一度データを受け取ったら購読解除
                resolve(data);
              },
              exchangeType
            );
          });
          
          // WebSocketからデータを取得できた場合
          if (wsData) {
            // リクエスト履歴に追加
            requestHistoryService.addEntry({
              url: `websocket/orderbook/${normalizedSymbol}`,
              method: 'WS',
              timestamp: Date.now(),
              duration: 0,
              status: 200,
              success: true
            });
            
            // 成功したらキャッシュに保存（WebSocketソース）
            if (useCache) {
              cacheService.set(requestKey, wsData, 'websocket');
            }
            
            return wsData;
          }
        } catch (wsError) {
          // WebSocketエラーをログに記録（フォールバックのため例外はスローしない）
          logger.warn(`WebSocketからのオーダーブック取得に失敗、RESTAPIにフォールバック: ${wsError}`, {
            component: 'DataFetchService',
            action: 'fetchOrderBook',
            symbol: normalizedSymbol,
            error: wsError
          });
        }
      }
      
      // WebSocketが失敗した場合またはWebSocketが接続されていない場合はRESTAPIを使用
      const startTime = Date.now();
      const api = new BitgetApiClient({}, exchangeType);
      const data = await api.getOrderBook(normalizedSymbol, exchangeType);
      const endTime = Date.now();
      
      // リクエスト履歴に追加
      requestHistoryService.addEntry({
        url: `bitget/orderbook/${normalizedSymbol}`,
        method: 'GET',
        timestamp: startTime,
        duration: endTime - startTime,
        status: 200,
        success: true
      });
      
      // 成功したらキャッシュに保存（RESTソース）
      if (useCache) {
        cacheService.set(requestKey, data, 'rest');
      }
      
      return data;
    } catch (error) {
      // エラー時もリクエスト履歴に追加
      requestHistoryService.addEntry({
        url: `bitget/orderbook/${normalizedSymbol}`,
        method: 'GET',
        timestamp: Date.now(),
        duration: 0,
        status: 500,
        success: false
      });
      
      logger.error(`オーダーブック取得エラー: ${error}`, {
        component: 'DataFetchService',
        action: 'fetchOrderBook',
        symbol,
        error
      });
      throw error;
    }
  }
  
  /**
   * チャートデータ取得（WebSocketとRESTAPIのハイブリッド）
   */
  async fetchChartData(
    symbol: string,
    timeFrame: Timeframe,
    exchangeType: ExchangeType,
    signal?: AbortSignal,
    useCache: boolean = true
  ): Promise<OHLCData[]> {
    // シンボルが空の場合はエラーをスロー
    if (!symbol || symbol.trim() === '') {
      logger.error('空のシンボルでチャートデータを取得しようとしました', {
        component: 'DataFetchService',
        action: 'fetchChartData',
        timeFrame,
        exchangeType
      });
      return [];
    }
    
    // 共通のnormalizeSymbol関数を使用してシンボルを正規化
    const normalizedSymbol = normalizeSymbol(symbol);
    
    const requestKey = `chart-${normalizedSymbol}-${timeFrame}-${exchangeType}`;
    
    logger.debug(`チャートデータ取得開始:`, {
      component: 'DataFetchService',
      action: 'fetchChartData',
      symbol: normalizedSymbol,
      timeFrame,
      exchangeType,
      useCache,
      requestKey
    });
    
    // キャッシュをチェック
    if (useCache) {
      const cachedData = cacheService.get<OHLCData[]>(requestKey);
      if (cachedData) {
        logger.debug(`キャッシュからデータを取得:`, {
          component: 'DataFetchService',
          action: 'fetchChartData',
          requestKey,
          dataCount: cachedData.length,
          timeFrame,
          exchangeType,
          dataSample: cachedData.slice(-3) // 最後の3件のデータをサンプルとして記録
        });
        
        return cachedData;
      }
    }
    
    try {
      // WebSocketサービスを取得
      const socketService = getSocketService();
      
      // WebSocketが接続されているか確認
      if (socketService && socketService.isConnected()) {
        try {
          // WebSocketからデータを取得（Promise化）
          // 注意: ローソク足データは配列で返されるため、複数のデータを受け取る必要がある
          const wsData = await new Promise<OHLCData[]>((resolve, reject) => {
            // タイムアウト設定
            const timeoutId = setTimeout(() => {
              reject(new Error('WebSocketからのデータ取得がタイムアウトしました'));
            }, 5000); // 5秒でタイムアウト
            
            // 受信したデータを格納する配列
            const receivedData: OHLCData[] = [];
            let dataCount = 0;
            
            // 一時的なサブスクリプション
            const unsubscribe = socketService.subscribeKline(
              normalizedSymbol,
              timeFrame,
              (data: OHLCData) => {
                receivedData.push(data);
                dataCount++;
                
                // 十分なデータが集まったら完了
                if (dataCount >= 10) { // 最低10件のデータを受信
                  clearTimeout(timeoutId);
                  unsubscribe(); // データを受け取ったら購読解除
                  resolve(receivedData);
                }
              },
              exchangeType
            );
            
            // 一定時間後にデータが少なくても返す
            setTimeout(() => {
              if (receivedData.length > 0) {
                clearTimeout(timeoutId);
                unsubscribe();
                resolve(receivedData);
              }
            }, 3000); // 3秒待機
          });
          
          // WebSocketからデータを取得できた場合
          if (wsData && wsData.length > 0) {
            // リクエスト履歴に追加
            requestHistoryService.addEntry({
              url: `websocket/chart/${normalizedSymbol}/${timeFrame}`,
              method: 'WS',
              timestamp: Date.now(),
              duration: 0,
              status: 200,
              success: true
            });
            
            // 成功したらキャッシュに保存（WebSocketソース）
            if (useCache) {
              cacheService.set(requestKey, wsData, 'websocket');
              
              logger.debug(`WebSocketからのデータをキャッシュに保存:`, {
                component: 'DataFetchService',
                action: 'fetchChartData',
                requestKey,
                dataCount: wsData.length,
                dataSample: wsData.slice(-3) // 最後の3件のデータをサンプルとして記録
              });
            }
            
            return wsData;
          }
        } catch (wsError) {
          // WebSocketエラーをログに記録（フォールバックのため例外はスローしない）
          logger.warn(`WebSocketからのチャートデータ取得に失敗、RESTAPIにフォールバック: ${wsError}`, {
            component: 'DataFetchService',
            action: 'fetchChartData',
            symbol: normalizedSymbol,
            timeFrame,
            error: wsError
          });
        }
      }
      
      // WebSocketが失敗した場合またはWebSocketが接続されていない場合はRESTAPIを使用
      const api = new BitgetApiClient({}, exchangeType);
      const data = await api.getHistoricalCandles(normalizedSymbol, timeFrame, 100);
      
      // リクエスト履歴に追加
      requestHistoryService.addEntry({
        url: `bitget/chart/${normalizedSymbol}/${timeFrame}`,
        method: 'GET',
        timestamp: Date.now(),
        duration: 0,
        status: 200,
        success: true
      });
      
      // 成功したらキャッシュに保存（RESTソース）
      if (useCache) {
        cacheService.set(requestKey, data, 'rest');
        
        logger.debug(`RESTAPIからのデータをキャッシュに保存:`, {
          component: 'DataFetchService',
          action: 'fetchChartData',
          requestKey,
          dataCount: data.length,
          dataSample: data.slice(-3) // 最後の3件のデータをサンプルとして記録
        });
      }
      
      return data;
    } catch (error) {
      logger.error(`チャートデータ取得エラー: ${error}`, {
        component: 'DataFetchService',
        action: 'fetchChartData',
        symbol: normalizedSymbol,
        timeFrame,
        error
      });
      throw error;
    }
  }
  
  /**
   * シンボル変更時にキャッシュをクリア
   */
  handleSymbolChange(newSymbol: string): void {
    // 正規化したシンボルを使用
    const normalizedSymbol = normalizeSymbol(newSymbol);
    
    // 当該シンボルに関連するキャッシュをすべてクリア
    cacheService.clear(`chart-${normalizedSymbol}`);
    cacheService.clear(`orderbook-${normalizedSymbol}`);
    
    logger.info(`シンボル変更: ${newSymbol} のキャッシュをクリアしました`, {
      component: 'DataFetchService',
      action: 'handleSymbolChange',
      symbol: newSymbol,
      normalizedSymbol
    });
  }
  
  /**
   * 時間足変更時にキャッシュをクリア
   */
  handleTimeframeChange(symbol: string, newTimeframe: Timeframe, exchangeType: ExchangeType = 'spot'): void {
    // 正規化したシンボルを使用
    const normalizedSymbol = normalizeSymbol(symbol);
    
    // 1. 厳密なキャッシュキーをクリア - タイムフレームと取引種別を含む
    const exactCacheKey = `chart-${normalizedSymbol}-${newTimeframe}-${exchangeType}`;
    cacheService.clear(exactCacheKey);
    
    // 2. このシンボルのすべてのタイムフレームをクリア
    const symbolBaseKey = `chart-${normalizedSymbol}`;
    cacheService.clear(symbolBaseKey);
    
    // 3. 全てのチャート関連キャッシュをクリア（より確実にするため）
    cacheService.clear('chart-');
    
    logger.info(`時間足変更: ${symbol} ${newTimeframe} (${exchangeType}) のキャッシュをクリアしました`, {
      component: 'DataFetchService',
      action: 'handleTimeframeChange',
      symbol,
      normalizedSymbol,
      timeframe: newTimeframe,
      exchangeType,
      clearedExactKey: exactCacheKey,
      clearedSymbolBaseKey: symbolBaseKey
    });
  }
  
  /**
   * WebSocketを使用してオーダーブックデータをリアルタイム購読
   */
  subscribeOrderBookRealtime(
    symbol: string,
    callback: (data: OrderBookData) => void,
    exchangeType: ExchangeType = 'spot'
  ): () => void {
    // シンボルを正規化
    const normalizedSymbol = normalizeSymbol(symbol);
    
    // WebSocketサービスを取得
    const socketService = getSocketService();
    
    // WebSocketが接続されているか確認
    if (socketService && !socketService.isConnected()) {
      // WebSocketが接続されていない場合は接続を試みる
      socketService.initializeMarketSocket();
    }
    
    // WebSocketを使用してオーダーブックを購読
    const unsubscribe = socketService.subscribeOrderBook(
      normalizedSymbol,
      (data: OrderBookData) => {
        // データをキャッシュに保存
        const requestKey = `orderbook-${normalizedSymbol}-${exchangeType}`;
        cacheService.set(requestKey, data, 'websocket');
        
        // コールバック関数を呼び出し
        callback(data);
      },
      exchangeType
    );
    
    return unsubscribe;
  }
  
  /**
   * WebSocketを使用してローソク足データをリアルタイム購読
   */
  subscribeKlineRealtime(
    symbol: string,
    timeFrame: Timeframe,
    callback: (data: OHLCData) => void,
    exchangeType: ExchangeType = 'spot'
  ): () => void {
    // シンボルを正規化
    const normalizedSymbol = normalizeSymbol(symbol);
    
    // WebSocketサービスを取得
    const socketService = getSocketService();
    
    // WebSocketが接続されているか確認
    if (socketService && !socketService.isConnected()) {
      // WebSocketが接続されていない場合は接続を試みる
      socketService.initializeMarketSocket();
    }
    
    // WebSocketを使用してローソク足データを購読
    const unsubscribe = socketService.subscribeKline(
      normalizedSymbol,
      timeFrame,
      (data: OHLCData) => {
        // データをキャッシュに保存（既存のキャッシュがあれば更新）
        const requestKey = `chart-${normalizedSymbol}-${timeFrame}-${exchangeType}`;
        const cachedData = cacheService.get<OHLCData[]>(requestKey);
        
        if (cachedData) {
          // 既存のデータがある場合は更新
          const updatedData = [...cachedData];
          
          // 同じ時間のデータがあれば更新、なければ追加
          const existingIndex = updatedData.findIndex(item => item.time === data.time);
          if (existingIndex !== -1) {
            updatedData[existingIndex] = data;
          } else {
            updatedData.push(data);
            
            // 時間順にソート
            updatedData.sort((a, b) => a.time - b.time);
          }
          
          // キャッシュを更新
          cacheService.set(requestKey, updatedData, 'websocket');
        } else {
          // 既存のデータがない場合は新規作成
          cacheService.set(requestKey, [data], 'websocket');
        }
        
        // コールバック関数を呼び出し
        callback(data);
      },
      exchangeType
    );
    
    return unsubscribe;
  }
}

// シングルトンインスタンスをエクスポート
export const dataFetchService = new DataFetchService();
