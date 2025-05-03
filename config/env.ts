// config/env.ts
// 作成: 環境変数の集中管理
// 
// このファイルはアプリケーション全体で使用される環境変数を一元管理します。
// 環境変数の型安全性とデフォルト値の管理を提供します。

/**
 * 環境変数の設定
 */
export const env = {
  /**
   * API関連の環境変数
   */
  api: {
    bitget: {
      /**
       * Bitget API のベースURL
       */
      baseUrl: process.env.NEXT_PUBLIC_BITGET_API_URL || 'https://api.bitget.com',
      
      /**
       * Bitget WebSocket のURL
       */
      wsUrl: process.env.NEXT_PUBLIC_BITGET_WS_URL || 'wss://ws.bitget.com/v2/ws/public',
      
      /**
       * デモモードを有効にするかどうか
       */
      enableDemoMode: process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true'
    }
  },
  
  /**
   * アプリケーションの実行環境
   */
  environment: {
    /**
     * 開発環境かどうか
     */
    isDevelopment: process.env.NODE_ENV === 'development',
    
    /**
     * 本番環境かどうか
     */
    isProduction: process.env.NODE_ENV === 'production',
    
    /**
     * テスト環境かどうか
     */
    isTest: process.env.NODE_ENV === 'test'
  },
  
  /**
   * フロントエンドの設定
   */
  frontend: {
    /**
     * アプリケーションのベースURL
     */
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    
    /**
     * デバッグモードを有効にするかどうか
     */
    debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true'
  }
};

/**
 * 環境変数の型定義
 */
export type Env = typeof env;
