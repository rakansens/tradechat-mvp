// services/api/common/environment.ts
// 作成: 環境検出ロジックを集約

/**
 * 環境判定用の定数
 */
export const IS_DEV = process.env.NODE_ENV === 'development';
export const IS_BROWSER = typeof window !== 'undefined';
export const IS_SERVER = !IS_BROWSER;

/**
 * 環境情報を取得
 */
export function getEnvironment() {
  return {
    isDevelopment: IS_DEV,
    isBrowser: IS_BROWSER,
    isServer: IS_SERVER
  };
}

/**
 * API環境設定を取得
 */
export function getApiConfig(provider: 'bitget' | string = 'bitget') {
  const configs: Record<string, {
    baseUrl: string;
    wsUrl: string;
    enableDemoMode: boolean;
  }> = {
    bitget: {
      baseUrl: process.env.NEXT_PUBLIC_BITGET_API_URL || 'https://api.bitget.com',
      wsUrl: process.env.NEXT_PUBLIC_BITGET_WS_URL || 'wss://ws.bitget.com/mix/v1/stream',
      enableDemoMode: process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true'
    }
    // 他のプロバイダーを追加可能
  };
  
  return configs[provider] || {
    baseUrl: '',
    wsUrl: '',
    enableDemoMode: false
  };
}
