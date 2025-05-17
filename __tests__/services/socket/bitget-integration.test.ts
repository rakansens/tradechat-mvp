/**
 * __tests__/services/socket/bitget-integration.test.ts
 * BitgetIntegrationクラスのテスト
 * 
 * 作成: 2025-05-12 - WebSocketサービスのリファクタリングに伴い新規作成
 */

import { BitgetIntegration } from '../../../services/socket/bitget-integration';
import { BitgetApiClient } from '../../../services/api/bitget/client';
import { ProductType } from '@/types/api';
import { logger } from '../../../utils/common';

// BitgetApiClientのモック
jest.mock('../../../services/api/bitget/client', () => {
  return {
    BitgetApiClient: jest.fn().mockImplementation(() => ({
      disconnectWebSocket: jest.fn(),
      fetchCandles: jest.fn(),
      fetchOrderBook: jest.fn(),
      subscribeToCandles: jest.fn(),
      subscribeToOrderBook: jest.fn()
    }))
  };
});

jest.mock('../../../utils/common', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('BitgetIntegration', () => {
  let bitgetIntegration: BitgetIntegration;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // BitgetIntegrationインスタンスを作成
    bitgetIntegration = new BitgetIntegration();
  });
  
  describe('initializeApiClient', () => {
    it('新しいBitgetApiClientを初期化できること', () => {
      // initializeApiClientを実行
      const apiClient = bitgetIntegration.initializeApiClient('spot' as ProductType);
      
      // 結果を検証
      expect(BitgetApiClient).toHaveBeenCalledWith({}, 'spot');
      expect(apiClient).toBeDefined();
      expect(logger.info).toHaveBeenCalledWith(
        'BitgetApiClient初期化成功',
        expect.objectContaining({
          component: 'BitgetIntegration',
          action: 'initializeApiClient',
          productType: 'spot'
        })
      );
    });
    
    it('既存のAPIクライアントがある場合は切断してから新しいクライアントを作成すること', () => {
      // 1回目の初期化
      const firstClient = bitgetIntegration.initializeApiClient('spot' as ProductType);
      
      // モックをリセット
      jest.clearAllMocks();
      
      // 2回目の初期化
      const secondClient = bitgetIntegration.initializeApiClient('futures' as ProductType);
      
      // 結果を検証
      expect(firstClient.disconnectWebSocket).toHaveBeenCalled();
      expect(BitgetApiClient).toHaveBeenCalledWith({}, 'futures');
      expect(secondClient).toBeDefined();
    });
    
    it('初期化中にエラーが発生した場合でもクライアントを返すこと', () => {
      // BitgetApiClientのコンストラクタでエラーを発生させる
      (BitgetApiClient as jest.Mock).mockImplementationOnce(() => {
        throw new Error('初期化エラー');
      });
      
      // initializeApiClientを実行
      const apiClient = bitgetIntegration.initializeApiClient('spot' as ProductType);
      
      // 結果を検証
      expect(logger.error).toHaveBeenCalledWith(
        'BitgetApiClient初期化エラー:',
        expect.any(Error),
        expect.objectContaining({
          component: 'BitgetIntegration',
          action: 'initializeApiClient',
          productType: 'spot',
          error: expect.any(Error)
        })
      );
      expect(apiClient).toBeDefined();
    });
  });
  
  describe('getCurrentApiClient', () => {
    it('現在のAPIクライアントを取得できること', () => {
      // APIクライアントを初期化
      const apiClient = bitgetIntegration.initializeApiClient('spot' as ProductType);
      
      // getCurrentApiClientを実行
      const currentClient = bitgetIntegration.getCurrentApiClient();
      
      // 結果を検証
      expect(currentClient).toBe(apiClient);
    });
    
    it('APIクライアントが初期化されていない場合はnullを返すこと', () => {
      // getCurrentApiClientを実行
      const currentClient = bitgetIntegration.getCurrentApiClient();
      
      // 結果を検証
      expect(currentClient).toBeNull();
    });
  });
  
  describe('disconnectApiClient', () => {
    it('APIクライアントを切断できること', () => {
      // APIクライアントを初期化
      const apiClient = bitgetIntegration.initializeApiClient('spot' as ProductType);
      
      // disconnectApiClientを実行
      bitgetIntegration.disconnectApiClient();
      
      // 結果を検証
      expect(apiClient.disconnectWebSocket).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        'BitgetApiClient切断成功',
        expect.objectContaining({
          component: 'BitgetIntegration',
          action: 'disconnectApiClient'
        })
      );
    });
    
    it('APIクライアントが初期化されていない場合は何もしないこと', () => {
      // disconnectApiClientを実行
      bitgetIntegration.disconnectApiClient();
      
      // 結果を検証
      expect(BitgetApiClient).not.toHaveBeenCalled();
    });
    
    it('切断中にエラーが発生した場合はログを出力すること', () => {
      // APIクライアントを初期化
      const apiClient = bitgetIntegration.initializeApiClient('spot' as ProductType);
      
      // disconnectWebSocketでエラーを発生させる
      (apiClient.disconnectWebSocket as jest.Mock).mockImplementation(() => {
        throw new Error('切断エラー');
      });
      
      // disconnectApiClientを実行
      bitgetIntegration.disconnectApiClient();
      
      // 結果を検証
      expect(logger.error).toHaveBeenCalledWith(
        'BitgetApiClient切断エラー:',
        expect.any(Error),
        expect.objectContaining({
          component: 'BitgetIntegration',
          action: 'disconnectApiClient',
          error: expect.any(Error)
        })
      );
    });
  });
});
