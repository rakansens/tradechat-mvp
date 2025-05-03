// jest.config.js
// Jestテスト設定ファイル

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // next.config.jsとテスト環境用の.envファイルが配置されたディレクトリのパス
  dir: './',
});

// Jestに渡すカスタム設定
const customJestConfig = {
  // テスト環境のセットアップファイルを追加
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // テストが実行されるディレクトリ
  testEnvironment: 'jest-environment-jsdom',
  // 別名のマッピング（@/importなど）
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // カバレッジレポートの設定
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!<rootDir>/out/**',
    '!<rootDir>/.next/**',
    '!<rootDir>/*.config.js',
    '!<rootDir>/coverage/**',
  ],
};

// createJestConfigを使用することによって、next/jest が提供する設定を併合した設定を生成する
module.exports = createJestConfig(customJestConfig);
