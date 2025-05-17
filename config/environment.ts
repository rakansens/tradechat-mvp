// config/environment.ts
// Centralized environment utilities and settings

export const IS_BROWSER = typeof window !== 'undefined';
export const IS_SERVER = !IS_BROWSER;

export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const IS_DEV = NODE_ENV === 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_TEST = NODE_ENV === 'test';

export interface ApiConfig {
  baseUrl: string;
  wsUrl: string;
  enableDemoMode: boolean;
}

export interface Env {
  api: {
    bitget: ApiConfig;
  };
  frontend: {
    baseUrl: string;
    debugMode: boolean;
  };
  supabase: {
    url: string;
    anonKey: string;
  };
  openaiApiKey?: string;
  libsqlDbUrl?: string;
  libsqlAuthToken?: string;
  apiBaseUrl: string;
}

const defaults = {
  bitgetApiUrl: 'https://api.bitget.com',
  bitgetWsUrl: 'wss://ws.bitget.com/v2/ws/public',
  frontendBaseUrl: 'http://localhost:3000',
  apiBaseUrl: 'http://localhost:3000',
};

export const env: Env = {
  api: {
    bitget: {
      baseUrl: process.env.NEXT_PUBLIC_BITGET_API_URL ?? defaults.bitgetApiUrl,
      wsUrl: process.env.NEXT_PUBLIC_BITGET_WS_URL ?? defaults.bitgetWsUrl,
      enableDemoMode: process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true',
    },
  },
  frontend: {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL ?? defaults.frontendBaseUrl,
    debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
  openaiApiKey: process.env.OPENAI_API_KEY,
  libsqlDbUrl: process.env.LIBSQL_DB_URL,
  libsqlAuthToken: process.env.LIBSQL_AUTH_TOKEN,
  apiBaseUrl: process.env.API_BASE_URL ?? defaults.apiBaseUrl,
};

export function getApiConfig(provider: 'bitget' | string = 'bitget'): ApiConfig {
  const configs: Record<string, ApiConfig> = {
    bitget: env.api.bitget,
  };
  return configs[provider] || { baseUrl: '', wsUrl: '', enableDemoMode: false };
}

export function getEnvironment() {
  return {
    isDevelopment: IS_DEV,
    isProduction: IS_PRODUCTION,
    isTest: IS_TEST,
    isBrowser: IS_BROWSER,
    isServer: IS_SERVER,
  };
}

export type { Env as Environment };
