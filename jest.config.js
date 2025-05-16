// jest.config.js
// Jestテスト設定ファイル
// 更新: 2025-10-06 - 追加のエイリアスマッピングを追加してTS2307エラーを解消

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.{ts,tsx,js,jsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/supabase/(.*)$': '<rootDir>/lib/supabase/$1',
    '^lightweight-charts$': '<rootDir>/__tests__/lightweight-charts.js',
    // Supabase関連のエイリアス
    '^@/lib/supabase/supabase$': '<rootDir>/lib/supabase/client',
    
    // 旧ストア参照の新ストアへのリダイレクト
    '^@/store/useSymbolStore$': '<rootDir>/store/symbol',
    '^@/store/socketActions$': '<rootDir>/store/socket',
    '^../.*/store/socketActions$': '<rootDir>/store/socket',
    '^../../store/useSymbolStore$': '<rootDir>/store/symbol',
    '^../../../store/socketActions$': '<rootDir>/store/socket',
    '^../../../store/useSymbolStore$': '<rootDir>/store/symbol',
    
    // hooksディレクトリのリファクタリングによる変更
    '^../utils/useDebugPolling$': '<rootDir>/hooks/debug/polling/useDebugPolling',
    '^../useLogs$': '<rootDir>/hooks/debug/logs/useLogs',
    
    // テスト関連の外部依存
    '^vitest$': 'jest',
    
    // アプリページの参照
    '^@/app/signin/page$': '<rootDir>/__tests__/mocks/signin-page-mock.js'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', {
      configFile: './__tests__/config/babel.config.js',
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }],
      ],
    }],
    '^.+\\.(js|jsx)$': ['babel-jest', {
      configFile: './__tests__/config/babel.config.js',
    }]
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@testing-library|react|react-dom|lucide-react|@radix-ui)/)'
  ]
};
