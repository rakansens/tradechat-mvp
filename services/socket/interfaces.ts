/**
 * services/socket/interfaces.ts
 * WebSocketサービスの共通インターフェース定義
 * 
 * 作成: 2025-05-12 - WebSocketサービスのリファクタリングの一環として
 * 責任: すべてのインターフェース定義を集約し、明確な責任分担を定義
 */

import { Socket } from 'socket.io-client';
import { OrderBookData } from '../../types/market';
import { OHLCData, Timeframe } from '../../types/chart';
import { ProductType } from '../../types/api';

/**
 * WebSocket接続管理インターフェース
 * WebSocketの接続、切断、状態管理を担当
 */
export interface IWebSocketClient {
  /**
   * WebSocket接続を初期化
   * @returns Socket.IOのソケットインスタンス、または接続失敗時はnull
   */
  initialize(): Socket | null;
  
  /**
   * 現在のSocketインスタンスを取得
   * @returns Socket.IOのソケットインスタンス、または未接続時はnull
   */
  getSocket(): Socket | null;
  
  /**
   * 接続状態を確認
   * @returns 接続されている場合はtrue
   */
  isConnected(): boolean;
  
  /**
   * WebSocket接続を切断
   */
  disconnect(): void;
  
  /**
   * 再接続をスケジュール
   */
  scheduleReconnect(): void;
}

/**
 * データ購読管理インターフェース
 * 各種マーケットデータの購読と購読解除を担当
 */
export interface ISubscriptionManager {
  /**
   * オーダーブックデータを購読
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @returns 購読解除用の関数
   */
  subscribeOrderBook(
    symbol: string,
    callback: (data: OrderBookData) => void,
    exchangeType?: ProductType
  ): () => void;
  
  /**
   * ローソク足データを購読
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param timeframe 時間枠（例: '1m', '1h'）
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @returns 購読解除用の関数
   */
  subscribeKline(
    symbol: string,
    timeframe: Timeframe,
    callback: (data: OHLCData) => void,
    exchangeType?: ProductType
  ): () => void;
  
  /**
   * 取引データを購読
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @returns 購読解除用の関数
   */
  subscribeTrades(
    symbol: string,
    callback: (data: any) => void,
    exchangeType?: ProductType
  ): () => void;
  
  /**
   * すべての購読を解除
   */
  unsubscribeAll(): void;
  
  /**
   * すべての購読を再購読
   */
  resubscribeAll(): void;
}

/**
 * BitgetAPI統合インターフェース
 * BitgetAPIクライアントの初期化と管理を担当
 */
export interface IBitgetIntegration {
  /**
   * BitgetAPIクライアントを初期化
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @param config 追加の設定オプション
   * @returns BitgetAPIクライアントインスタンス
   */
  initializeApiClient(
    exchangeType: ProductType,
    config?: Record<string, any>
  ): any;
  
  /**
   * 現在のBitgetAPIクライアントを取得
   * @returns 現在のBitgetAPIクライアントインスタンス
   */
  getCurrentApiClient(): any | null;
  
  /**
   * BitgetAPIクライアントを切断
   */
  disconnectApiClient(): void;
}

/**
 * 外部向けWebSocketサービスインターフェース
 * アプリケーションの他の部分から使用される主要なインターフェース
 */
export interface ISocketService {
  /**
   * マーケットデータ用のWebSocket接続を初期化
   * @returns Socket.IOのソケットインスタンス
   */
  initializeMarketSocket(): Socket | null;
  
  /**
   * BitgetAPIクライアントを初期化
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @param config 追加の設定オプション
   * @returns BitgetAPIクライアントインスタンス
   */
  initializeApiClient(
    exchangeType: ProductType,
    config?: Record<string, any>
  ): any;
  
  /**
   * 現在のBitgetAPIクライアントを取得
   * @returns 現在のBitgetAPIクライアントインスタンス
   */
  getCurrentApiClient(): any | null;
  
  /**
   * オーダーブックデータを購読
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @returns 購読解除用の関数
   */
  subscribeOrderBook(
    symbol: string,
    callback: (data: OrderBookData) => void,
    exchangeType?: ProductType
  ): () => void;
  
  /**
   * ローソク足データを購読
   * @param symbol シンボル（例: 'BTC/USDT'）
   * @param timeframe 時間枠（例: '1m', '1h'）
   * @param callback データ受信時のコールバック関数
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @returns 購読解除用の関数
   */
  subscribeKline(
    symbol: string,
    timeframe: Timeframe,
    callback: (data: OHLCData) => void,
    exchangeType?: ProductType
  ): () => void;
  
  /**
   * すべての接続を切断
   */
  disconnectAll(): void;
  
  /**
   * 再接続をスケジュール
   */
  scheduleReconnect(): void;
  
  /**
   * すべての購読を再購読
   */
  resubscribeAll(): void;

  /**
   * 接続状態を確認
   * @returns 接続されている場合はtrue
   */
  isConnected(): boolean;
}
