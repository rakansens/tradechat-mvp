// config/environment.ts
// Consolidated environment utilities and settings

export const IS_BROWSER = typeof window !== 'undefined';
export const IS_SERVER = !IS_BROWSER;

export const NODE_ENV = process.env.NODE_ENV;
export const IS_DEV = NODE_ENV === 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_TEST = NODE_ENV === 'test';

export function getEnvironment() {
  return {
    isDevelopment: IS_DEV,
    isProduction: IS_PRODUCTION,
    isTest: IS_TEST,
    isBrowser: IS_BROWSER,
    isServer: IS_SERVER,
  };
}

export function getApiConfig(provider: 'bitget' | string = 'bitget') {
  const configs: Record<string, { baseUrl: string; wsUrl: string; enableDemoMode: boolean }> = {
    bitget: {
      baseUrl: process.env.NEXT_PUBLIC_BITGET_API_URL || 'https://api.bitget.com',
      wsUrl: process.env.NEXT_PUBLIC_BITGET_WS_URL || 'wss://ws.bitget.com/mix/v1/stream',
      enableDemoMode: process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true',
    },
  };

  return configs[provider] || { baseUrl: '', wsUrl: '', enableDemoMode: false };
}

export const env = {
  api: {
    bitget: {
      baseUrl: process.env.NEXT_PUBLIC_BITGET_API_URL || 'https://api.bitget.com',
      wsUrl: process.env.NEXT_PUBLIC_BITGET_WS_URL || 'wss://ws.bitget.com/v2/ws/public',
      enableDemoMode: process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true',
    },
  },
  environment: {
    isDevelopment: IS_DEV,
    isProduction: IS_PRODUCTION,
    isTest: IS_TEST,
  },
  frontend: {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  },
};

export type Env = typeof env;
