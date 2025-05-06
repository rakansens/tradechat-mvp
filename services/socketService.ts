// services/socketService.ts
// 作成: ソケット初期化の責任を一箇所に集約するサービス

import { Socket } from 'socket.io-client';
import { initializeSocketClient, getSocket } from '@/utils/socketClient';
import { BitgetApiClient } from '@/services/bitgetApi';
import { ExchangeType } from '@/types/api';
import { logger } from '@/utils/logger';

// シングルトンインスタンス
let bitgetApi: BitgetApiClient | null = null;

/**
 * ソケットサービス
 * 
 * Socket.io接続とBitgetApiClientの初期化を一箇所で管理します。
 * ClientLayoutとChartSectionで異なるソケット初期化関数を呼び出す代わりに、
 * このサービスを使用して統一的に初期化を行います。
 */
export const socketService = {
  /**
   * 基本的なSocket.io接続を初期化
   * 
   * @returns Socket.ioのソケットインスタンス
   */
  initializeBaseSocket(): Socket | null {
    try {
      // ブラウザ環境かどうかを確認
      if (typeof window === 'undefined') {
        logger.warn('socketServiceはブラウザ環境でのみ初期化できます', {
          component: 'socketService',
          action: 'initializeBaseSocket'
        });
        return null;
      }
      
      // Socket.io接続を初期化
      initializeSocketClient();
      return getSocket();
    } catch (error) {
      logger.error('Socket.IO初期化エラー:', error, {
        component: 'socketService',
        action: 'initializeBaseSocket'
      });
      return null;
    }
  },
  
  /**
   * 特定の取引タイプに対応したBitgetApiClientを初期化
   * 
   * @param exchangeType 取引タイプ（'spot'または'futures'）
   * @param config 追加の設定オプション
   * @returns BitgetApiClientインスタンス
   */
  initializeApiClient(exchangeType: ExchangeType, config: Record<string, any> = {}): BitgetApiClient {
    try {
      // 既存のAPIクライアントがあれば切断
      if (bitgetApi) {
        bitgetApi.disconnectWebSocket();
      }
      
      // 新しいAPIクライアントを作成
      bitgetApi = new BitgetApiClient(config, exchangeType);
      
      logger.info('BitgetApiClient初期化成功', {
        component: 'socketService',
        action: 'initializeApiClient',
        exchangeType
      });
      
      return bitgetApi;
    } catch (error) {
      logger.error('BitgetApiClient初期化エラー:', error, {
        component: 'socketService',
        action: 'initializeApiClient',
        exchangeType
      });
      
      // エラーが発生した場合でもクライアントを返す（エラーハンドリングは呼び出し側で行う）
      bitgetApi = new BitgetApiClient(config, exchangeType);
      return bitgetApi;
    }
  },
  
  /**
   * 現在のBitgetApiClientインスタンスを取得
   * 
   * @returns 現在のBitgetApiClientインスタンス
   */
  getCurrentApiClient(): BitgetApiClient | null {
    return bitgetApi;
  },
  
  /**
   * すべてのソケット接続を切断
   */
  disconnectAll(): void {
    try {
      // BitgetApiClientの切断
      if (bitgetApi) {
        bitgetApi.disconnectWebSocket();
        bitgetApi = null;
      }
      
      // Socket.ioの切断は自動的に行われるため、ここでは特に何もしない
      
      logger.info('すべてのソケット接続を切断しました', {
        component: 'socketService',
        action: 'disconnectAll'
      });
    } catch (error) {
      logger.error('ソケット切断エラー:', error, {
        component: 'socketService',
        action: 'disconnectAll'
      });
    }
  }
};