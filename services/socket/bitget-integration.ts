/**
 * services/socket/bitget-integration.ts
 * BitgetAPIとの統合を担当
 * 
 * 作成: 2025-05-12 - WebSocketサービスのリファクタリングの一環として
 * 変更: index.tsからBitgetAPI統合機能を分離
 */

import { ProductType } from '@/types/api';
import { BitgetApiClient } from '../api/bitget/client.new';
import { logger } from '../../utils/logger';
import { IBitgetIntegration } from './interfaces';

/**
 * BitgetAPI統合クラス
 * BitgetAPIクライアントの初期化と管理を担当
 */
export class BitgetIntegration implements IBitgetIntegration {
  private bitgetApi: BitgetApiClient | null = null;

  /**
   * BitgetAPIクライアントを初期化
   * @param exchangeType 取引種別（'spot'または'futures'）
   * @param config 追加の設定オプション
   * @returns BitgetAPIクライアントインスタンス
   */
  initializeApiClient(productType: ProductType, config: Record<string, any> = {}): BitgetApiClient {
    try {
      // 既存のAPIクライアントがあれば切断
      if (this.bitgetApi) {
        this.bitgetApi.disconnectWebSocket();
      }
      
      // 新しいAPIクライアントを作成
      this.bitgetApi = new BitgetApiClient(config, productType);
      
      logger.info('BitgetApiClient初期化成功', {
        component: 'BitgetIntegration',
        action: 'initializeApiClient',
        productType
      });
      
      return this.bitgetApi;
    } catch (error) {
      logger.error('BitgetApiClient初期化エラー:', error, {
        component: 'BitgetIntegration',
        action: 'initializeApiClient',
        productType,
        error
      });
      
      // エラーが発生した場合でもクライアントを返す（エラーハンドリングは呼び出し側で行う）
      this.bitgetApi = new BitgetApiClient(config, productType);
      return this.bitgetApi;
    }
  }

  /**
   * 現在のBitgetAPIクライアントを取得
   * @returns 現在のBitgetAPIクライアントインスタンス
   */
  getCurrentApiClient(): BitgetApiClient | null {
    return this.bitgetApi;
  }

  /**
   * BitgetAPIクライアントを切断
   */
  disconnectApiClient(): void {
    if (this.bitgetApi) {
      try {
        this.bitgetApi.disconnectWebSocket();
        logger.info('BitgetApiClient切断成功', {
          component: 'BitgetIntegration',
          action: 'disconnectApiClient'
        });
      } catch (error) {
        logger.error('BitgetApiClient切断エラー:', error, {
          component: 'BitgetIntegration',
          action: 'disconnectApiClient',
          error
        });
      }
    }
  }
}

// シングルトンインスタンス
let bitgetIntegrationInstance: BitgetIntegration | null = null;

/**
 * BitgetIntegrationのシングルトンインスタンスを取得
 * @returns BitgetIntegrationインスタンス
 */
export function getBitgetIntegration(): BitgetIntegration {
  if (!bitgetIntegrationInstance) {
    bitgetIntegrationInstance = new BitgetIntegration();
  }
  return bitgetIntegrationInstance;
}
