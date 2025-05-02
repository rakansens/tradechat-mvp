// jest.config.js
// Jestテスト設定ファイル

/** @type {import('jest').Config} */
module.exports = {
  // セットアップファイルを使用して環境変数を設定
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // テストの実行環境
  testEnvironment: 'node',
  
  // 自動モック設定
  automock: false,

  // カバレッジ設定
  collectCoverage: true,
  collectCoverageFrom: [
    'src/mastra/**/*.{js,jsx,ts,tsx}',
    'app/api/mastra/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
  ],
  // 統合テスト重視のためカバレッジ要件を緩和
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 50,
      statements: 50,
    },
  },
  
  // テスト対象のファイル名パターン
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  
  // テストパスの無視パターン
  testPathIgnorePatterns: [
    "/node_modules/",
    "src/mastra/integrations/__tests__/index.test.ts" // Exclude outdated integration test
  ],
  
  // モジュール解決設定
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // TypeScript とエディタの設定
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  testTimeout: 30000, // Increase default timeout to 30 seconds
};
