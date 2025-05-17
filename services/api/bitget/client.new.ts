/**
 * services/api/bitget/client.ts
 * Bitget APIクライアントの実装
 * 
 * 作成: 2025-05-12 - BitgetApiClientのリファクタリング
 * 更新: 2025-05-12 - 責務の分離とモジュール化
 * 
 * このファイルは、IBitgetApiClientインターフェースを実装したクライアントクラスを提供します。
 * 既存の実装との互換性を保ちながら、段階的なリファクタリングを可能にします。
 */

import { ExchangeType, ProductType, BitgetCredentials } from '../../../types/api';
import { OHLCData } from '../../../types/chart';
import { OrderBookData } from '../../../types/market';
import { IRestApiClient, IWebSocketClient } from '../interfaces';
import { BitgetApiClientOptions, IBitgetApiClient } from './interfaces';
import { getApiConfig, IS_DEV } from '../common/environment';
import { logger } from '../../../utils/logger';
import { formatSymbol } from './utils';
import { BitgetRestClient } from './rest-client';
import { BitgetWebSocketClient } from './ws-client';
import { BitgetDataTransformer } from './data-transformer';
import { BitgetDemoGenerator } from './demo-generator';

/**
 * BitgetApiClientクラス
 * Bitget取引所のAPIを操作するためのクライアント
 * 
 * ファサードパターンを採用し、各責務を専門のクラスに委譲します：
 * - BitgetRestClient: REST API通信
 * - BitgetWebSocketClient: WebSocket通信
 * - BitgetDataTransformer: データ変換
 * - BitgetDemoGenerator: デモデータ生成
 */
export class BitgetApiClient implements IBitgetApiClient {
  // 設定
  private credentials: BitgetCredentials;
  private baseUrl: string;
  private wsUrl: string;
  private enableDemoMode: boolean;
  private productType: ProductType = 'spot';
  private exchangeType: ExchangeType;
  private isInDemoMode: boolean = false;
  
  // コンポーネント
  private restClient: BitgetRestClient;
  private wsClient: BitgetWebSocketClient;
  private dataTransformer: BitgetDataTransformer;
  private demoGenerator: BitgetDemoGenerator;
  
  /**
   * BitgetApiClientのコンストラクタ
   * @param options クライアントオプション
   * @param productType 取引種別（'spot'または'futures'、デフォルト: 'spot'）
   * @param exchangeType 取引所タイプ（デフォルト: 'bitget'）
   */
  constructor(options: BitgetApiClientOptions = {}, productType: ProductType = 'spot', exchangeType: ExchangeType = 'bitget') {
    // API設定を環境設定から取得
    const apiConfig = getApiConfig('bitget');
    
    this.credentials = options.credentials || {};
    this.baseUrl = options.baseUrl || apiConfig.baseUrl;
    this.wsUrl = options.wsUrl || apiConfig.wsUrl;
    this.enableDemoMode = options.enableDemoMode !== undefined ? options.enableDemoMode : apiConfig.enableDemoMode;
    this.productType = productType;
    this.exchangeType = exchangeType;
    
    // コンポーネントの初期化
    this.restClient = new BitgetRestClient();
    this.wsClient = new BitgetWebSocketClient({
      wsUrl: this.wsUrl,
      credentials: this.credentials,
      productType: this.productType,
      exchangeType: this.exchangeType
    });
    this.dataTransformer = new BitgetDataTransformer();
    this.demoGenerator = new BitgetDemoGenerator();
    
    logger.info('BitgetApiClient initialized', {
      component: 'BitgetApiClient',
      action: 'constructor',
      exchangeType: this.exchangeType,
      baseUrl: this.baseUrl
    });
  }
  
  /**
   * REST APIクライアントを取得
   * @returns IRestApiClientインターフェースを実装したクライアント
   */
  getRestClient(): IRestApiClient {
    return this.restClient;
  }
  
  /**
   * WebSocketクライアントを取得
   * @returns IWebSocketClientインターフェースを実装したクライアント
   */
  getWebSocketClient(): IWebSocketClient {
    return this.wsClient;
  }
  
  /**
   * WebSocket接続を確立
   */
  connectWebSocket(): void {
    this.wsClient.connect().catch(error => {
      logger.error('Failed to connect WebSocket', error, {
        component: 'BitgetApiClient',
        action: 'connectWebSocket'
      });
    });
  }
  
  /**
   * WebSocket接続を閉じる
   */
  disconnectWebSocket(): void {
    this.wsClient.disconnect();
  }
  
  /**
   * オーダーブックデータを購読
   * @param symbol シンボル
   * @param callback コールバック関数
   * @returns 購読解除用の関数
   */
  subscribeOrderBook(
    symbol: string,
    callback: (data: OrderBookData) => void
  ): () => void {
    return this.wsClient.subscribeOrderBook(symbol, callback);
  }
  
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
  ): () => void {
    return this.wsClient.subscribeCandles(symbol, timeframe, callback);
  }

  /**
   * ローソク足データを取得
   * @param symbol シンボル
   * @param timeframe タイムフレーム
   * @param limit 取得件数
   * @param type 取引タイプ
   * @returns ローソク足データの配列
   */
  async fetchCandles(
    symbol: string,
    timeframe: string,
    limit: number = 100,
    type: ExchangeType = 'bitget'
  ): Promise<OHLCData[]> {
    try {
      logger.info(`Fetching candles for ${symbol} with timeframe ${timeframe}`, {
        component: 'BitgetApiClient',
        action: 'fetchCandles',
        symbol,
        timeframe,
        limit,
        type
      });
      
      // REST APIクライアントを使用してデータを取得
      return await this.restClient.fetchCandles(symbol, timeframe, limit);
    } catch (error) {
      logger.error(`Failed to fetch candles: ${error}`, {
        component: 'BitgetApiClient',
        action: 'fetchCandles',
        symbol,
        timeframe,
        error
      });
      
      // エラー時にデモモードが有効な場合はデモデータを生成
      if (this.enableDemoMode) {
        this.isInDemoMode = true;
        logger.warn('Using demo mode for candles data', {
          component: 'BitgetApiClient',
          action: 'fetchCandles'
        });
        return this.demoGenerator.generateDemoCandles(limit);
      }
      
      // デモモードが無効な場合は空配列を返す
      return [];
    }
  }

  /**
   * 注文板データを取得
   * @param symbol シンボル
   * @param limit 取得件数
   * @param type 取引タイプ
   * @returns 注文板データ
   */
  async fetchOrderBook(
    symbol: string,
    limit: number = 20,
    type: ExchangeType = 'bitget'
  ): Promise<OrderBookData> {
    try {
      logger.info(`Fetching order book for ${symbol}`, {
        component: 'BitgetApiClient',
        action: 'fetchOrderBook',
        symbol,
        limit,
        type
      });
      
      // REST APIクライアントを使用してデータを取得
      return await this.restClient.fetchOrderBook(symbol, limit, type);
    } catch (error) {
      logger.error(`Failed to fetch order book: ${error}`, {
        component: 'BitgetApiClient',
        action: 'fetchOrderBook',
        symbol,
        error
      });
      
      // エラー時にデモモードが有効な場合はデモデータを生成
      if (this.enableDemoMode) {
        this.isInDemoMode = true;
        logger.warn('Using demo mode for order book data', {
          component: 'BitgetApiClient',
          action: 'fetchOrderBook'
        });
        return this.demoGenerator.generateDemoOrderBook(symbol);
      }
      
      // デモモードが無効な場合は空のオーダーブックを返す
      return {
        symbol,
        asks: [],
        bids: [],
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * デモモードの状態を取得
   * @returns デモモードかどうか
   */
  isInDemoModeEnabled(): boolean {
    return this.isInDemoMode;
  }
}
